import mockAlerts from '../../../firebase/functions/scripts/data/mock-nws-alerts.json';

// Dev-only stand-in for the nws_alerts collection, for when the Firestore
// emulator isn't reachable (e.g. iOS 26.5+ simulators). Turned on with
// EXPO_PUBLIC_MOCK_NWS_ALERTS=true; see the README.

type MockFeature = {
  geometry: unknown | null;
  properties: Record<string, unknown> & { id: string; sent: string };
};

const DATE_FIELDS = ['sent', 'effective', 'onset', 'expires', 'ends'];

// Same as seed-nws-mock.ts: shift every date so the newest alert was sent now
// and the rest keep their timing relative to it.
function shiftToNow(features: MockFeature[]): MockFeature[] {
  const offset = Date.now() - Math.max(...features.map(({ properties }) => Date.parse(properties.sent)));
  return features.map((feature) => {
    const properties = { ...feature.properties };
    for (const field of DATE_FIELDS) {
      const value = properties[field];
      if (typeof value === 'string') {
        properties[field] = new Date(Date.parse(value) + offset).toISOString();
      }
    }
    return { ...feature, properties };
  });
}

// Returns the mock alerts as nws_alerts documents, in the shape pollNWSAlerts writes.
export function getMockNwsAlertDocs(): { id: string; data: Record<string, unknown> }[] {
  return shiftToNow((mockAlerts as { features: MockFeature[] }).features).map(({ geometry, properties }) => ({
    id: properties.id,
    data: { ...properties, geometry: geometry ? JSON.stringify(geometry) : null },
  }));
}
