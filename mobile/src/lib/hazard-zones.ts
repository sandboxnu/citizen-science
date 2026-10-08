import {
  collection,
  onSnapshot,
  query,
  where,
} from "@react-native-firebase/firestore";
import { useEffect, useState } from "react";

import { firestore } from "@/lib/firebase";

export type Coordinate = { latitude: number; longitude: number };

export type HazardZone = {
  id: string;
  event: string;
  polygons: Coordinate[][]; // outer rings only
};

type Position = [number, number]; // GeoJSON [lng, lat]

type Geometry =
  | { type: "Polygon"; coordinates: Position[][] }
  | { type: "MultiPolygon"; coordinates: Position[][][] };

const toCoordinates = (ring: Position[]): Coordinate[] =>
  ring.map(([longitude, latitude]) => ({ latitude, longitude }));

// geometry is stored as a GeoJSON string because Firestore doesn't support
// nested arrays. NWS alerts can have null geometry, so those are skipped.
function parsePolygons(geometry: unknown): Coordinate[][] {
  if (typeof geometry !== "string") return [];
  const parsed = JSON.parse(geometry) as Geometry;
  switch (parsed.type) {
    case "Polygon":
      return [toCoordinates(parsed.coordinates[0])];
    case "MultiPolygon":
      return parsed.coordinates.map((polygon) => toCoordinates(polygon[0]));
    default:
      return [];
  }
}

// Subscribes to active hazard zones in Firestore.
export function useHazardZones(): HazardZone[] {
  const [zones, setZones] = useState<HazardZone[]>([]);

  useEffect(() => {
    const activeZones = query(
      collection(firestore, "hazard_zones"),
      where("active", "==", true)
    );

    return onSnapshot(
      activeZones,
      (snapshot) => {
        const next: HazardZone[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          try {
            next.push({
              id: doc.id,
              event: String(data.event ?? ""),
              polygons: parsePolygons(data.geometry),
            });
          } catch (error) {
            console.warn(`Skipping hazard zone ${doc.id} with bad geometry`, error);
          }
        });
        setZones(next);
      },
      (error) => console.warn("Failed to load hazard zones", error)
    );
  }, []);

  return zones;
}
