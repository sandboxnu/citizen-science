import ExpoModulesCore
import MapKit

// Apple Maps search for the map search bar: `autocomplete` lists suggestions as the user types
// (addresses, cities, businesses, landmarks), and `resolve` turns a tapped suggestion into a
// coordinate.
public class PlaceSearchModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PlaceSearch")

    AsyncFunction("autocomplete") {
      (query: String, latitude: Double, longitude: Double, radiusMeters: Double) async throws -> [[String: String]] in
      let region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: latitude, longitude: longitude),
        latitudinalMeters: radiusMeters * 2,
        longitudinalMeters: radiusMeters * 2
      )
      return try await searcher.autocomplete(query, region: region)
    }

    AsyncFunction("resolve") { (id: String) async throws -> [String: Any]? in
      return try await searcher.resolve(id)
    }
  }
}

// MapKit must be used on the main thread.
@MainActor private let searcher = PlaceSearcher()

private let maxCachedRows = 200

@MainActor
private final class PlaceSearcher: NSObject, @preconcurrency MKLocalSearchCompleterDelegate {
  // What a row in the JS results list stands for: a type-ahead suggestion (no coordinate until
  // looked up) or a full-search result (already has one).
  private enum CachedRow {
    case suggestion(MKLocalSearchCompletion)
    case place(MKMapItem)
  }

  // Every row handed to JS, by its id, so `resolve` can find the place behind a tapped row. Each
  // row gets a fresh id, so tapping a row from an older search still finds its own place.
  private var cachedRowsById: [String: CachedRow] = [:]
  private var nextRowId = 0

  private let completer = MKLocalSearchCompleter()
  // The `autocomplete` call waiting on the completer's answer.
  private var pending: CheckedContinuation<[MKLocalSearchCompletion], Never>?

  override init() {
    super.init()
    completer.delegate = self
    completer.resultTypes = [.address, .pointOfInterest]
  }

  /// Call as the user types. Text rows only (no coordinates), each cached by id for `resolve`.
  /// [] if nothing matches; throws if the search fails.
  func autocomplete(_ query: String, region: MKCoordinateRegion) async throws -> [[String: String]] {
    if cachedRowsById.count > maxCachedRows { cachedRowsById.removeAll() }

    let completions = await complete(query, region: region)
    if !completions.isEmpty {
      return completions.map { cacheRow(.suggestion($0), title: $0.title, subtitle: $0.subtitle) }
    }

    // Type-ahead only matches what's typed; the full search corrects misspellings
    // ("northeatsern" -> Northeastern University), so try it when type-ahead finds nothing.
    let request = MKLocalSearch.Request()
    request.naturalLanguageQuery = query
    request.region = region
    request.resultTypes = [.address, .pointOfInterest]
    return try await search(request).map {
      cacheRow(.place($0), title: $0.name ?? query, subtitle: Self.address(of: $0.placemark))
    }
  }

  /// Call once, for the tapped row. Its coordinate and kind; type-ahead rows need one lookup.
  /// nil if not found; throws if the lookup fails.
  func resolve(_ id: String) async throws -> [String: Any]? {
    switch cachedRowsById[id] {
    case .place(let item):
      return Self.describe(item)
    case .suggestion(let completion):
      return try await search(MKLocalSearch.Request(completion: completion)).first.map(Self.describe)
    case nil:
      return nil
    }
  }

  // Caches the row under a new id and returns what JS shows for it.
  private func cacheRow(_ row: CachedRow, title: String, subtitle: String) -> [String: String] {
    nextRowId += 1
    let id = String(nextRowId)
    cachedRowsById[id] = row
    return ["id": id, "title": title, "subtitle": subtitle]
  }

  // MKLocalSearch reports "nothing found" as an error; treat it as no results.
  private func search(_ request: MKLocalSearch.Request) async throws -> [MKMapItem] {
    do {
      return try await MKLocalSearch(request: request).start().mapItems
    } catch let error as MKError where error.code == .placemarkNotFound {
      return []
    }
  }

  // Coordinate plus how specific the place is, which sets how far the map zooms in.
  private static func describe(_ item: MKMapItem) -> [String: Any] {
    let placemark = item.placemark
    let kind =
      item.pointOfInterestCategory != nil || placemark.thoroughfare != nil ? "address"
      : placemark.locality != nil ? "city"
      : placemark.administrativeArea != nil ? "region"
      : "country"
    return [
      "latitude": placemark.coordinate.latitude,
      "longitude": placemark.coordinate.longitude,
      "kind": kind,
    ]
  }

  // "360 Huntington Ave, Boston, MA", like the type-ahead subtitles.
  private static func address(of placemark: MKPlacemark) -> String {
    let street = [placemark.subThoroughfare, placemark.thoroughfare].compactMap { $0 }.joined(separator: " ")
    return [street, placemark.locality, placemark.administrativeArea]
      .compactMap { $0 }
      .filter { !$0.isEmpty }
      .joined(separator: ", ")
  }

  // The completer answers through the delegate methods below rather than returning results, so
  // this waits for that answer. A newer query answers the waiting one with [] so it never hangs.
  private func complete(_ query: String, region: MKCoordinateRegion) async -> [MKLocalSearchCompletion] {
    finish([])
    return await withCheckedContinuation { continuation in
      pending = continuation
      completer.region = region
      completer.queryFragment = query  // starts the search
    }
  }

  private func finish(_ results: [MKLocalSearchCompletion]) {
    pending?.resume(returning: results)
    pending = nil
  }

  func completerDidUpdateResults(_ completer: MKLocalSearchCompleter) {
    finish(completer.results)
  }

  func completer(_ completer: MKLocalSearchCompleter, didFailWithError error: Error) {
    finish([])
  }
}
