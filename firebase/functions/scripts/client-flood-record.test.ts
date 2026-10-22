import { describe, expect, test } from "@jest/globals";
import { isClientFloodRecord } from "./client-flood-record";

describe("ClientFloodRecord validation", () => {
  
  test('accepts a record with a valid geometry string', () => {
const flood_record: unknown = {
  geometry: JSON.stringify({
    type: "Polygon",
    coordinates: [[
      [-80.72455276233954, 36.562358449062465],
      [-80.72455276233954, 36.56226585640665],
      [-80.72427498726223, 36.56226585640665],
      [-80.72427498726223, 36.562358449062465],
      [-80.72455276233954, 36.562358449062465],
    ]],
  }),
};
    const result = isClientFloodRecord(flood_record);
    expect(result).toBe(true);
  });

  test('rejects a record missing geometry', () => {
const flood_record: unknown = {
  geometry: JSON.stringify({
    type: "Polygon",
    coordinates: [[
      [null,null],
    ]],
  }),
};
    const result = isClientFloodRecord(flood_record);
    expect(result).toBe(false);
  });

  test('rejects a record with a malformed geometry string', () => {
const flood_record: unknown = {
  geometry: JSON.stringify({
    type: "Polygon",
    coordinates: [[
      [-80.72455276233954, 36.562358449062465],
      [-80.72455276233954, 36.56226585640665],
      ["hello","hello"],
      [-80.72427498726223, 36.562358449062465],
      [-80.72455276233954, 36.562358449062465],
    ]],
  }),
};
    const result = isClientFloodRecord(flood_record);
    expect(result).toBe(false);
  });


  test('rejects a record with non-JSON string', () => {
  const flood_record: unknown = { geometry: "not valid JSON" };
    const result = isClientFloodRecord(flood_record);
    expect(result).toBe(false);
  });
});
