// Generates mock NWS flood alerts across the continental US so the map has
// something to show when zoomed out. Shapes are built to look like the real
// products: Flash Flood Warnings are small storm-based polygons, river Flood
// Warnings are narrow bands along a winding river, and areal Flood Warnings
// are small blobs over low-lying neighborhoods. Flood Watches have no shape,
// like most real ones (they're issued by forecast zone). A fixed PRNG seed
// keeps the output identical on every run.

type Position = [number, number];
type Geometry = { type: "Polygon"; coordinates: Position[][] };

export type MockFeature = {
  geometry: Geometry | null;
  properties: Record<string, unknown> & { id: string; sent: string };
};

type Place = {
  city: string;
  state: string;
  county: string;
  river: string;
  office: string;
  lon: number;
  lat: number;
};

const PLACES: Place[] = [
  { city: "Seattle", state: "WA", county: "King", river: "Snoqualmie River", office: "Seattle WA", lon: -122.33, lat: 47.61 },
  { city: "Portland", state: "OR", county: "Multnomah", river: "Willamette River", office: "Portland OR", lon: -122.68, lat: 45.52 },
  { city: "Eugene", state: "OR", county: "Lane", river: "McKenzie River", office: "Portland OR", lon: -123.09, lat: 44.05 },
  { city: "Spokane", state: "WA", county: "Spokane", river: "Spokane River", office: "Spokane WA", lon: -117.43, lat: 47.66 },
  { city: "Boise", state: "ID", county: "Ada", river: "Boise River", office: "Boise ID", lon: -116.2, lat: 43.62 },
  { city: "Sacramento", state: "CA", county: "Sacramento", river: "American River", office: "Sacramento CA", lon: -121.49, lat: 38.58 },
  { city: "Santa Rosa", state: "CA", county: "Sonoma", river: "Russian River", office: "San Francisco CA", lon: -122.71, lat: 38.44 },
  { city: "Fresno", state: "CA", county: "Fresno", river: "Kings River", office: "Hanford CA", lon: -119.79, lat: 36.74 },
  { city: "Los Angeles", state: "CA", county: "Los Angeles", river: "Los Angeles River", office: "Los Angeles CA", lon: -118.24, lat: 34.05 },
  { city: "San Diego", state: "CA", county: "San Diego", river: "San Diego River", office: "San Diego CA", lon: -117.16, lat: 32.72 },
  { city: "Las Vegas", state: "NV", county: "Clark", river: "Las Vegas Wash", office: "Las Vegas NV", lon: -115.14, lat: 36.17 },
  { city: "Reno", state: "NV", county: "Washoe", river: "Truckee River", office: "Reno NV", lon: -119.81, lat: 39.53 },
  { city: "Phoenix", state: "AZ", county: "Maricopa", river: "Salt River", office: "Phoenix AZ", lon: -112.07, lat: 33.45 },
  { city: "Flagstaff", state: "AZ", county: "Coconino", river: "Rio de Flag", office: "Flagstaff AZ", lon: -111.65, lat: 35.2 },
  { city: "Tucson", state: "AZ", county: "Pima", river: "Santa Cruz River", office: "Tucson AZ", lon: -110.97, lat: 32.22 },
  { city: "Salt Lake City", state: "UT", county: "Salt Lake", river: "Jordan River", office: "Salt Lake City UT", lon: -111.89, lat: 40.76 },
  { city: "Albuquerque", state: "NM", county: "Bernalillo", river: "Rio Grande", office: "Albuquerque NM", lon: -106.65, lat: 35.08 },
  { city: "Denver", state: "CO", county: "Denver", river: "South Platte River", office: "Denver/Boulder CO", lon: -104.99, lat: 39.74 },
  { city: "Billings", state: "MT", county: "Yellowstone", river: "Yellowstone River", office: "Billings MT", lon: -108.5, lat: 45.78 },
  { city: "Missoula", state: "MT", county: "Missoula", river: "Clark Fork", office: "Missoula MT", lon: -114.0, lat: 46.87 },
  { city: "Casper", state: "WY", county: "Natrona", river: "North Platte River", office: "Riverton WY", lon: -106.31, lat: 42.87 },
  { city: "Rapid City", state: "SD", county: "Pennington", river: "Rapid Creek", office: "Rapid City SD", lon: -103.23, lat: 44.08 },
  { city: "Fargo", state: "ND", county: "Cass", river: "Red River of the North", office: "Grand Forks ND", lon: -96.79, lat: 46.88 },
  { city: "Bismarck", state: "ND", county: "Burleigh", river: "Missouri River", office: "Bismarck ND", lon: -100.78, lat: 46.81 },
  { city: "Omaha", state: "NE", county: "Douglas", river: "Missouri River", office: "Omaha/Valley NE", lon: -95.94, lat: 41.26 },
  { city: "Wichita", state: "KS", county: "Sedgwick", river: "Arkansas River", office: "Wichita KS", lon: -97.34, lat: 37.69 },
  { city: "Oklahoma City", state: "OK", county: "Oklahoma", river: "North Canadian River", office: "Norman OK", lon: -97.52, lat: 35.47 },
  { city: "Tulsa", state: "OK", county: "Tulsa", river: "Arkansas River", office: "Tulsa OK", lon: -95.99, lat: 36.15 },
  { city: "Dallas", state: "TX", county: "Dallas", river: "Trinity River", office: "Fort Worth TX", lon: -96.8, lat: 32.78 },
  { city: "Austin", state: "TX", county: "Travis", river: "Colorado River", office: "Austin/San Antonio TX", lon: -97.74, lat: 30.27 },
  { city: "San Antonio", state: "TX", county: "Bexar", river: "San Antonio River", office: "Austin/San Antonio TX", lon: -98.49, lat: 29.42 },
  { city: "Kerrville", state: "TX", county: "Kerr", river: "Guadalupe River", office: "Austin/San Antonio TX", lon: -99.14, lat: 30.05 },
  { city: "Houston", state: "TX", county: "Harris", river: "Buffalo Bayou", office: "Houston/Galveston TX", lon: -95.37, lat: 29.76 },
  { city: "Beaumont", state: "TX", county: "Jefferson", river: "Neches River", office: "Lake Charles LA", lon: -94.1, lat: 30.08 },
  { city: "El Paso", state: "TX", county: "El Paso", river: "Rio Grande", office: "El Paso TX", lon: -106.49, lat: 31.76 },
  { city: "Minneapolis", state: "MN", county: "Hennepin", river: "Mississippi River", office: "Twin Cities/Chanhassen MN", lon: -93.27, lat: 44.98 },
  { city: "Duluth", state: "MN", county: "St. Louis", river: "St. Louis River", office: "Duluth MN", lon: -92.1, lat: 46.79 },
  { city: "Des Moines", state: "IA", county: "Polk", river: "Des Moines River", office: "Des Moines IA", lon: -93.61, lat: 41.59 },
  { city: "Cedar Rapids", state: "IA", county: "Linn", river: "Cedar River", office: "Quad Cities IA/IL", lon: -91.67, lat: 41.98 },
  { city: "Kansas City", state: "MO", county: "Jackson", river: "Missouri River", office: "Kansas City/Pleasant Hill MO", lon: -94.58, lat: 39.1 },
  { city: "St. Louis", state: "MO", county: "St. Louis", river: "Meramec River", office: "St. Louis MO", lon: -90.2, lat: 38.63 },
  { city: "Little Rock", state: "AR", county: "Pulaski", river: "Arkansas River", office: "Little Rock AR", lon: -92.29, lat: 34.75 },
  { city: "Shreveport", state: "LA", county: "Caddo", river: "Red River", office: "Shreveport LA", lon: -93.75, lat: 32.53 },
  { city: "Baton Rouge", state: "LA", county: "East Baton Rouge", river: "Amite River", office: "New Orleans LA", lon: -91.19, lat: 30.45 },
  { city: "Jackson", state: "MS", county: "Hinds", river: "Pearl River", office: "Jackson MS", lon: -90.18, lat: 32.3 },
  { city: "Memphis", state: "TN", county: "Shelby", river: "Wolf River", office: "Memphis TN", lon: -90.05, lat: 35.15 },
  { city: "Nashville", state: "TN", county: "Davidson", river: "Cumberland River", office: "Nashville TN", lon: -86.78, lat: 36.16 },
  { city: "Chattanooga", state: "TN", county: "Hamilton", river: "Tennessee River", office: "Morristown TN", lon: -85.31, lat: 35.05 },
  { city: "Birmingham", state: "AL", county: "Jefferson", river: "Cahaba River", office: "Birmingham AL", lon: -86.8, lat: 33.52 },
  { city: "Mobile", state: "AL", county: "Mobile", river: "Mobile River", office: "Mobile AL", lon: -88.04, lat: 30.69 },
  { city: "Milwaukee", state: "WI", county: "Milwaukee", river: "Menomonee River", office: "Milwaukee/Sullivan WI", lon: -87.91, lat: 43.04 },
  { city: "Chicago", state: "IL", county: "Cook", river: "Des Plaines River", office: "Chicago IL", lon: -87.63, lat: 41.88 },
  { city: "Peoria", state: "IL", county: "Peoria", river: "Illinois River", office: "Lincoln IL", lon: -89.59, lat: 40.69 },
  { city: "Indianapolis", state: "IN", county: "Marion", river: "White River", office: "Indianapolis IN", lon: -86.16, lat: 39.77 },
  { city: "Louisville", state: "KY", county: "Jefferson", river: "Ohio River", office: "Louisville KY", lon: -85.76, lat: 38.25 },
  { city: "Hazard", state: "KY", county: "Perry", river: "North Fork Kentucky River", office: "Jackson KY", lon: -83.19, lat: 37.25 },
  { city: "Detroit", state: "MI", county: "Wayne", river: "Rouge River", office: "Detroit/Pontiac MI", lon: -83.05, lat: 42.33 },
  { city: "Grand Rapids", state: "MI", county: "Kent", river: "Grand River", office: "Grand Rapids MI", lon: -85.67, lat: 42.96 },
  { city: "Columbus", state: "OH", county: "Franklin", river: "Scioto River", office: "Wilmington OH", lon: -83.0, lat: 39.96 },
  { city: "Cleveland", state: "OH", county: "Cuyahoga", river: "Cuyahoga River", office: "Cleveland OH", lon: -81.69, lat: 41.5 },
  { city: "Pittsburgh", state: "PA", county: "Allegheny", river: "Monongahela River", office: "Pittsburgh PA", lon: -79.99, lat: 40.44 },
  { city: "Harrisburg", state: "PA", county: "Dauphin", river: "Susquehanna River", office: "State College PA", lon: -76.88, lat: 40.27 },
  { city: "Charleston", state: "WV", county: "Kanawha", river: "Kanawha River", office: "Charleston WV", lon: -81.63, lat: 38.35 },
  { city: "Richmond", state: "VA", county: "Henrico", river: "James River", office: "Wakefield VA", lon: -77.44, lat: 37.54 },
  { city: "Roanoke", state: "VA", county: "Roanoke", river: "Roanoke River", office: "Blacksburg VA", lon: -79.94, lat: 37.27 },
  { city: "Baltimore", state: "MD", county: "Baltimore", river: "Patapsco River", office: "Baltimore MD/Washington DC", lon: -76.61, lat: 39.29 },
  { city: "Trenton", state: "NJ", county: "Mercer", river: "Delaware River", office: "Mount Holly NJ", lon: -74.76, lat: 40.22 },
  { city: "New York", state: "NY", county: "Queens", river: "Flushing Creek", office: "New York NY", lon: -73.84, lat: 40.73 },
  { city: "Binghamton", state: "NY", county: "Broome", river: "Susquehanna River", office: "Binghamton NY", lon: -75.92, lat: 42.1 },
  { city: "Albany", state: "NY", county: "Albany", river: "Mohawk River", office: "Albany NY", lon: -73.76, lat: 42.65 },
  { city: "Montpelier", state: "VT", county: "Washington", river: "Winooski River", office: "Burlington VT", lon: -72.58, lat: 44.26 },
  { city: "Concord", state: "NH", county: "Merrimack", river: "Merrimack River", office: "Gray ME", lon: -71.54, lat: 43.21 },
  { city: "Boston", state: "MA", county: "Middlesex", river: "Charles River", office: "Boston/Norton MA", lon: -71.06, lat: 42.36 },
  { city: "Hartford", state: "CT", county: "Hartford", river: "Connecticut River", office: "Boston/Norton MA", lon: -72.68, lat: 41.77 },
  { city: "Bangor", state: "ME", county: "Penobscot", river: "Penobscot River", office: "Caribou ME", lon: -68.77, lat: 44.8 },
  { city: "Columbia", state: "SC", county: "Richland", river: "Congaree River", office: "Columbia SC", lon: -81.03, lat: 34.0 },
  { city: "Charleston", state: "SC", county: "Charleston", river: "Ashley River", office: "Charleston SC", lon: -79.93, lat: 32.78 },
  { city: "Atlanta", state: "GA", county: "Fulton", river: "Chattahoochee River", office: "Peachtree City GA", lon: -84.39, lat: 33.75 },
  { city: "Savannah", state: "GA", county: "Chatham", river: "Savannah River", office: "Charleston SC", lon: -81.1, lat: 32.08 },
  { city: "Tallahassee", state: "FL", county: "Leon", river: "Ochlockonee River", office: "Tallahassee FL", lon: -84.28, lat: 30.44 },
  { city: "Jacksonville", state: "FL", county: "Duval", river: "St. Johns River", office: "Jacksonville FL", lon: -81.66, lat: 30.33 },
  { city: "Tampa", state: "FL", county: "Hillsborough", river: "Hillsborough River", office: "Tampa Bay Area FL", lon: -82.46, lat: 27.95 },
  { city: "Fort Myers", state: "FL", county: "Lee", river: "Caloosahatchee River", office: "Tampa Bay Area FL", lon: -81.87, lat: 26.64 },
  { city: "Miami", state: "FL", county: "Miami-Dade", river: "Miami River", office: "Miami FL", lon: -80.19, lat: 25.76 },
];

// mulberry32: small seeded PRNG so every run generates the same alerts.
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(20261022);
const between = (min: number, max: number) => min + random() * (max - min);
const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];
const round = (n: number) => Math.round(n * 10000) / 10000;

// Offsets in degrees are scaled so shapes don't look squashed at high latitudes.
function offset(lon: number, lat: number, dx: number, dy: number): Position {
  return [round(lon + dx / Math.cos((lat * Math.PI) / 180)), round(lat + dy)];
}

const close = (ring: Position[]): Position[] => [...ring, ring[0]];

// Organic blob: a circle whose radius wobbles with a few random harmonics.
function blob(lon: number, lat: number, radius: number): Position[] {
  const harmonics = [2, 3, 5].map((k) => ({ k, amp: between(0.05, 0.22), phase: between(0, Math.PI * 2) }));
  const points = 28;
  const ring: Position[] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = radius * (1 + harmonics.reduce((sum, { k, amp, phase }) => sum + amp * Math.sin(k * angle + phase), 0));
    ring.push(offset(lon, lat, r * Math.cos(angle), r * Math.sin(angle)));
  }
  return close(ring);
}

// Storm-based warning polygon: 4-6 straight edges, like NWS forecasters draw.
function stormPolygon(lon: number, lat: number, size: number): Position[] {
  const vertices = 4 + Math.floor(random() * 3);
  const rotation = between(0, Math.PI * 2);
  const stretch = between(1.2, 2.2);
  const ring: Position[] = [];
  for (let i = 0; i < vertices; i++) {
    const angle = rotation + (i / vertices) * Math.PI * 2 + between(-0.25, 0.25);
    const r = size * between(0.7, 1.1);
    const x = r * Math.cos(angle) * stretch;
    const y = r * Math.sin(angle);
    ring.push(offset(lon, lat, x * Math.cos(rotation) - y * Math.sin(rotation), x * Math.sin(rotation) + y * Math.cos(rotation)));
  }
  return close(ring);
}

// River corridor: a meandering centerline buffered into a narrow band that widens downstream.
function riverCorridor(lon: number, lat: number, length: number, width: number): Position[] {
  const steps = 14;
  let heading = between(0, Math.PI * 2);
  let x = 0;
  let y = 0;
  const left: Position[] = [];
  const right: Position[] = [];
  for (let i = 0; i <= steps; i++) {
    heading += between(-0.5, 0.5);
    const halfWidth = width * (0.6 + (i / steps) * 0.8);
    const nx = -Math.sin(heading) * halfWidth;
    const ny = Math.cos(heading) * halfWidth;
    left.push(offset(lon, lat, x + nx, y + ny));
    right.push(offset(lon, lat, x - nx, y - ny));
    x += (Math.cos(heading) * length) / steps;
    y += (Math.sin(heading) * length) / steps;
  }
  return close([...left, ...right.reverse()]);
}

// "October 22 at 3:00PM"
function formatTime(date: Date) {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const hours = date.getHours() % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${months[date.getMonth()]} ${date.getDate()} at ${hours}:${minutes}${date.getHours() < 12 ? "AM" : "PM"}`;
}

const HOUR = 60 * 60 * 1000;
const iso = (ms: number) => new Date(ms).toISOString();

function timing(now: number, durationHours: [number, number]) {
  const sent = now - between(0.1, 6) * HOUR;
  const ends = now + between(...durationHours) * HOUR;
  return { sent, ends };
}

function base(place: Place, id: string, event: string, severity: string, sent: number, ends: number, expires: number) {
  return {
    id,
    areaDesc: `${place.county}, ${place.state}`,
    sent: iso(sent),
    effective: iso(sent),
    onset: iso(sent),
    expires: iso(expires),
    ends: iso(ends),
    status: "Actual",
    messageType: random() < 0.25 ? "Update" : "Alert",
    category: "Met",
    severity,
    event,
    senderName: `NWS ${place.office}`,
    headline: `${event} issued ${formatTime(new Date(sent))} until ${formatTime(new Date(ends))} by NWS ${place.office}`,
  };
}

function flashFloodWarning(place: Place, now: number, index: number): MockFeature {
  const emergency = random() < 0.12;
  const { sent, ends } = timing(now, [1.5, 6]);
  const rain = `${Math.floor(between(2, 5))} and ${Math.floor(between(5, 9))} inches`;
  return {
    geometry: {
      type: "Polygon",
      coordinates: [stormPolygon(place.lon + between(-0.25, 0.25), place.lat + between(-0.25, 0.25), between(0.025, 0.07))],
    },
    properties: {
      ...base(place, `mock-us-ffw-${slug(place)}-${index}`, "Flash Flood Warning", emergency ? "Extreme" : "Severe", sent, ends, ends),
      certainty: emergency ? "Observed" : "Likely",
      urgency: "Immediate",
      response: "Avoid",
      description:
        `FFW${place.state}\n\nThe National Weather Service in ${place.office} has issued a\n\n` +
        `* Flash Flood Warning for...\n${place.county} County in ${place.state}...\n\n` +
        `* At this time, Doppler radar indicated thunderstorms producing heavy rain\nnear ${place.city}. Between ${rain} of rain have fallen.\n\n` +
        (emergency ? `This is a FLASH FLOOD EMERGENCY for ${place.city}. SEEK HIGHER GROUND NOW!\n\n` : "") +
        `HAZARD...${emergency ? "Life threatening flash flooding." : "Flash flooding caused by thunderstorms."}\n\n` +
        `SOURCE...${emergency ? "Emergency management reported." : "Radar indicated."}\n\n` +
        `IMPACT...${emergency
          ? "Severe and widespread flash flooding of homes, businesses, roads and\nbridges is ongoing. Water rescues are in progress."
          : "Flash flooding of small creeks and streams, urban areas, highways,\nstreets and underpasses as well as other drainage areas."}\n\n` +
        `* Some locations that will experience flash flooding include...\n${place.city} and surrounding areas along the ${place.river}.`,
      instruction: emergency
        ? `This is a FLASH FLOOD EMERGENCY for ${place.city}. SEEK HIGHER GROUND NOW!\nDo not attempt to travel unless you are fleeing an area subject to flooding.`
        : "Turn around, don't drown when encountering flooded roads. Most flood\ndeaths occur in vehicles.",
      parameters: {
        flashFloodDetection: [emergency ? "OBSERVED" : "RADAR INDICATED"],
        ...(emergency && { flashFloodDamageThreat: ["CATASTROPHIC"] }),
      },
    },
  };
}

function floodWarning(place: Place, now: number, index: number): MockFeature {
  const level = pick(["Minor", "Moderate", "Major"]);
  const { sent, ends } = timing(now, [24, 72]);
  const stage = Math.round(between(8, 25) * 10) / 10;
  const crest = Math.round((stage + between(1, 6)) * 10) / 10;
  return {
    geometry: {
      type: "Polygon",
      coordinates: [riverCorridor(place.lon + between(-0.3, 0.3), place.lat + between(-0.3, 0.3), between(0.12, 0.35), between(0.003, 0.008))],
    },
    properties: {
      ...base(place, `mock-us-flw-${slug(place)}-${index}`, "Flood Warning", level === "Minor" ? "Moderate" : "Severe", sent, ends, now + between(6, 12) * HOUR),
      certainty: "Likely",
      urgency: "Expected",
      response: "Avoid",
      description:
        `...The National Weather Service in ${place.office} has issued a Flood Warning\nfor the following rivers in ${place.state}...\n\n` +
        `${place.river} near ${place.city} affecting ${place.county} County.\n\n` +
        `* WHAT...${level} flooding is forecast.\n\n` +
        `* WHERE...${place.river} near ${place.city}.\n\n` +
        `* WHEN...Until further notice.\n\n` +
        `* IMPACTS...At ${crest} feet, water affects low-lying roads and properties\nalong the ${place.river}.\n\n` +
        `* ADDITIONAL DETAILS...\n- The stage is currently ${stage} feet.\n- Forecast...The river is expected to crest near ${crest} feet.\n- http://www.weather.gov/safety/flood`,
      instruction: "Turn around, don't drown when encountering flooded roads. Most flood\ndeaths occur in vehicles.",
      parameters: { NWSheadline: [`FLOOD WARNING IN EFFECT FOR THE ${place.river.toUpperCase()}`] },
    },
  };
}

function floodWatch(place: Place, now: number): MockFeature {
  const { sent, ends } = timing(now, [24, 60]);
  return {
    geometry: null,
    properties: {
      ...base(place, `mock-us-ffa-${slug(place)}`, "Flood Watch", "Severe", sent, ends, ends),
      certainty: "Possible",
      urgency: "Future",
      response: "Prepare",
      description:
        `* WHAT...Flooding caused by excessive rainfall is possible.\n\n` +
        `* WHERE...Portions of ${place.state}, including ${place.county} County and the\n${place.city} area.\n\n` +
        `* WHEN...Through ${formatTime(new Date(ends))}.\n\n` +
        `* IMPACTS...Excessive runoff may result in flooding of rivers, creeks,\nstreams, and other low-lying and flood-prone locations.\n\n` +
        `* ADDITIONAL DETAILS...\n- ${Math.floor(between(2, 4))} to ${Math.floor(between(4, 8))} inches of rain are possible.\n- http://www.weather.gov/safety/flood`,
      instruction: "You should monitor later forecasts and be alert for possible Flood\nWarnings.",
      parameters: {},
    },
  };
}

// Areal flooding of low-lying neighborhoods: a small blob, a few km across.
function arealFloodWarning(place: Place, now: number, index: number): MockFeature {
  const { sent, ends } = timing(now, [3, 12]);
  return {
    geometry: {
      type: "Polygon",
      coordinates: [blob(place.lon + between(-0.2, 0.2), place.lat + between(-0.2, 0.2), between(0.008, 0.025))],
    },
    properties: {
      ...base(place, `mock-us-fla-${slug(place)}-${index}`, "Flood Warning", "Moderate", sent, ends, ends),
      certainty: "Likely",
      urgency: "Expected",
      response: "Avoid",
      description:
        `* WHAT...Flooding caused by excessive rainfall is expected.\n\n` +
        `* WHERE...Low-lying and poor drainage areas of ${place.city}.\n\n` +
        `* WHEN...Until ${formatTime(new Date(ends))}.\n\n` +
        `* IMPACTS...Flooding of streets, parking lots and underpasses. Some\nhomes and businesses near the ${place.river} may take on water.\n\n` +
        `* ADDITIONAL DETAILS...\n- Between 1 and 3 inches of rain have fallen.\n- http://www.weather.gov/safety/flood`,
      instruction: "Turn around, don't drown when encountering flooded roads. Most flood\ndeaths occur in vehicles.",
      parameters: {},
    },
  };
}

const slug = (place: Place) => `${place.city}-${place.state}`.toLowerCase().replace(/[^a-z]+/g, "-");

const count = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));

// Each place gets a handful of small shapes, plus a shapeless Flood Watch about half the time.
export function generateUsAlerts(now: number = Date.now()): MockFeature[] {
  const features: MockFeature[] = [];
  for (const place of PLACES) {
    if (random() < 0.5) features.push(floodWatch(place, now));
    for (let i = count(1, 2); i > 0; i--) features.push(floodWarning(place, now, i));
    for (let i = count(0, 3); i > 0; i--) features.push(flashFloodWarning(place, now, i));
    for (let i = count(0, 3); i > 0; i--) features.push(arealFloodWarning(place, now, i));
  }
  return features;
}
