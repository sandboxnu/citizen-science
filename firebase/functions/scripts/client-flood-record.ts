// Kept separate from seed-client.ts, which seeds the emulator as soon as it's
// imported, so tests can import this without side effects.

// TODO: use this in place of Record<string, unknown> in seed-client.ts, and
// validate records against it before writing (see client-flood-record.test.ts)
export interface ClientFloodRecord {
  geometry: string;
}

export function isClientFloodRecord(flood_record: unknown): flood_record is ClientFloodRecord {
  if (typeof flood_record !== 'object' || flood_record === null) {
    console.log("Invalid flood record: not an object or null");
    return false;
  }

  const potential = flood_record as Record<string, unknown>;
  let geom;

  if (typeof potential.geometry === "string") {
    try {
     geom = JSON.parse(potential.geometry)
    } catch {
      return false;
    }

    return geom.coordinates.every((ring: any) =>
      ring.every((val: number[]) => val.every((coord: number) => Number.isFinite(coord)))
    );
  }
  return false
}
