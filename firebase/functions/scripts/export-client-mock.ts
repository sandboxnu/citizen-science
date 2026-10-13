import * as fs from "fs";
import * as path from "path";
import * as gdal from "gdal-async";

// Regenerates scripts/data/mock-hazard-zones.json, the committed data seed.ts
// writes on every `npm run dev`. Picks the largest real flood polygons from
// data/Unified_FIM.gpkg (gitignored, ask the team for it) near the Map tab's
// default location, so the seed looks exactly like what seed-client produces.
// Run from functions/ with: npm run seed:export-client-mock

// Keep in sync with MOCK_USER_LOCATION in mobile/src/app/(tabs)/index.tsx
const CENTER = { latitude: 36.2, longitude: -81.7 }; // Boone, NC
const SEARCH_RADIUS_DEG = 0.025; // ~2.5 km, roughly the initial map view
const ZONE_COUNT = 30;

type Position = [number, number];
type PolygonGeometry = { type: "Polygon"; coordinates: Position[][] };

const round = (n: number) => Math.round(n * 1e6) / 1e6;

const layer = gdal.open("data/Unified_FIM.gpkg").layers.get(0);
layer.setSpatialFilter(
  CENTER.longitude - SEARCH_RADIUS_DEG,
  CENTER.latitude - SEARCH_RADIUS_DEG,
  CENTER.longitude + SEARCH_RADIUS_DEG,
  CENTER.latitude + SEARCH_RADIUS_DEG,
);

const candidates: { fid: number; area: number; geometry: PolygonGeometry }[] = [];
layer.features.forEach((feature) => {
  const geom = feature.getGeometry();
  if (!(geom instanceof gdal.Polygon)) return;
  const geometry = geom.toObject() as PolygonGeometry;
  candidates.push({
    fid: feature.fid,
    area: geom.getArea(),
    geometry: {
      type: "Polygon",
      coordinates: geometry.coordinates.map((ring) => ring.map(([lng, lat]) => [round(lng), round(lat)])),
    },
  });
});

const zones: Record<string, PolygonGeometry> = {};
candidates
  .sort((a, b) => b.area - a.area)
  .slice(0, ZONE_COUNT)
  .forEach(({ fid, geometry }) => {
    zones[`seed-${fid}`] = geometry;
  });

const outPath = path.join(__dirname, "data/mock-hazard-zones.json");
fs.writeFileSync(outPath, JSON.stringify(zones) + "\n");
console.log(`Wrote ${Object.keys(zones).length} of ${candidates.length} nearby zones to ${outPath}`);
