import ExpoModulesCore
import MapKit

// Apple Maps search for the map search bar: `autocomplete` lists suggestions as the user types
// (addresses, cities, businesses, landmarks), and `resolve` turns a tapped suggestion into a
// coordinate.
public class PlaceSearchModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PlaceSearch")

    AsyncFunction("autocomplete") {
      (query: String, latitude: Double, longitude: Double, radiusMeters: Double) async throws -> [[String: Any]] in
      let center = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
      return try await searcher.autocomplete(query, center: center, radiusMeters: radiusMeters)
    }

    AsyncFunction("resolve") { (id: String) async throws -> [String: Any]? in
      return try await searcher.resolve(id)
    }
  }
}

@MainActor private let searcher = PlaceSearcher()

// Rows handed to JS are kept here so `resolve` can find them by id. Older batches stay valid
// (a slow, stale search can't break the current rows) until the cache is trimmed.
private let maxCachedRows = 200

@MainActor
private final class PlaceSearcher: NSObject, @preconcurrency MKLocalSearchCompleterDelegate {
  private let completer = MKLocalSearchCompleter()
  private var pending: CheckedContinuation<[MKLocalSearchCompletion], Never>?
  private var batch = 0
  // Type-ahead suggestions only get a coordinate once looked up.
  private var suggestions: [String: MKLocalSearchCompletion] = [:]
  // Full-search results already have one.
  private var mapItems: [String: MKMapItem] = [:]

  override init() {
    super.init()
    completer.delegate = self
    completer.resultTypes = [.address, .pointOfInterest]
  }

  // Throws only when the search itself fails (offline, service error); no matches is [].
  func autocomplete(_ query: String, center: CLLocationCoordinate2D, radiusMeters: Double) async throws -> [[String: Any]] {
    let region = MKCoordinateRegion(
      center: center,
      latitudinalMeters: radiusMeters * 2,
      longitudinalMeters: radiusMeters * 2
    )
    batch += 1
    let batchId = batch
    if suggestions.count + mapItems.count > maxCachedRows {
      suggestions.removeAll()
      mapItems.removeAll()
    }

    let completions = await complete(query, region: region)
    if !completions.isEmpty {
      return completions.enumerated().map { index, completion in
        let id = "c\(batchId)-\(index)"
        suggestions[id] = completion
        return ["id": id, "title": completion.title, "subtitle": completion.subtitle]
      }
    }

    // Type-ahead only matches what's typed; the full search corrects misspellings
    // ("northeatsern" -> Northeastern University), so try it when type-ahead finds nothing.
    let request = MKLocalSearch.Request()
    request.naturalLanguageQuery = query
    request.region = region
    request.resultTypes = [.address, .pointOfInterest]
    let response: MKLocalSearch.Response
    do {
      response = try await MKLocalSearch(request: request).start()
    } catch let error as MKError where error.code == .placemarkNotFound {
      return []
    }
    return response.mapItems.enumerated().map { index, item in
      let id = "s\(batchId)-\(index)"
      mapItems[id] = item
      return ["id": id, "title": item.name ?? query, "subtitle": Self.address(of: item.placemark)]
    }
  }

  func resolve(_ id: String) async throws -> [String: Any]? {
    if let item = mapItems[id] { return Self.describe(item) }
    guard let completion = suggestions[id] else { return nil }
    let response = try await MKLocalSearch(request: MKLocalSearch.Request(completion: completion)).start()
    return response.mapItems.first.map(Self.describe)
  }

  private static func describe(_ item: MKMapItem) -> [String: Any] {
    let placemark = item.placemark
    return [
      "latitude": placemark.coordinate.latitude,
      "longitude": placemark.coordinate.longitude,
      "isPointOfInterest": item.pointOfInterestCategory != nil,
      "hasStreet": placemark.thoroughfare != nil,
      "hasCity": placemark.locality != nil,
      "hasRegion": placemark.administrativeArea != nil,
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

  // MKLocalSearchCompleter is delegate-based; this turns one query into one awaited answer. A
  // newer query answers the pending one with [] so stale callers never hang.
  private func complete(_ query: String, region: MKCoordinateRegion) async -> [MKLocalSearchCompletion] {
    finish([])
    return await withCheckedContinuation { continuation in
      pending = continuation
      completer.region = region
      completer.queryFragment = query
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
