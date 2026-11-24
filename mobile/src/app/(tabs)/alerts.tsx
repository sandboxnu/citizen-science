import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertItem } from '@/components/alert-item';
import { ThemedView } from '@/components/themed-view';
import { AlertItemColors, FontFamily, Spacing } from '@/constants/theme';
import { MOCK_USER_LOCATION, MOCK_LOCATION_ACCURACY_METERS } from './index';
import { fetchHazardZones, isLocationInHazardZone, HazardZone } from '@/lib/hazard-zones';

const activeBoundaryAlert = {
  type: 'boundary' as const,
  read: false,
  startDate: '2026-11-15T20:30:33.196Z',
  endDate: '2026-11-15T20:30:33.196Z',
  title: '',
  message: '',
}


const activeFloodingAlerts = [
  {
    type: 'flood',
    read: true,
    startDate: '2026-11-15T20:30:33.196Z',
    endDate: '2026-11-15T20:30:33.196Z',
    title: '',
    message: '',
  },
  {
    type: 'flood',
    read: true,
    startDate: '2026-11-04T20:30:33.196Z',
    endDate: '2026-11-15T20:30:33.196Z',
    title: '',
    message: '',
  },
] as const;

export default function AlertsScreen() {
  const [zones, setZones] = useState<HazardZone[]>([]);

  useEffect(() => {
    let isMounted = true;

    fetchHazardZones()
      .then((fetchedZones) => {
        if (isMounted) setZones(fetchedZones);
      })
      .catch(() => {
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const insideFloodBoundary = zones.some((zone) =>
    isLocationInHazardZone(MOCK_USER_LOCATION, MOCK_LOCATION_ACCURACY_METERS, zone.polygons)
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Your Notifications</Text>
          <View style={styles.list}>
            {[...activeFloodingAlerts]
              .sort(
                (a, b) =>
                  new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
              )
              .map((alert) => (
                <AlertItem
                  key={alert.startDate}
                  type={alert.type}
                  read={alert.read}
                  startDate={alert.startDate}
                  endDate={alert.endDate}
                  title={alert.title}
                  message={alert.message}
                />
              ))}
            {insideFloodBoundary && 
            <AlertItem 
              type={activeBoundaryAlert.type}
              read={activeBoundaryAlert.read}
              startDate={activeBoundaryAlert.startDate}
              endDate={activeBoundaryAlert.endDate}
              title={activeBoundaryAlert.title}
              message={activeBoundaryAlert.message}
              />
            }
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AlertItemColors.background },
  safeArea: { flex: 1 },
  content: {
    paddingTop: Spacing.ten,
    paddingBottom: Spacing.three,
    gap: Spacing.four,
  },
  title: {
    paddingHorizontal: Spacing.four,
    fontFamily: FontFamily.regular,
    fontSize: 20,
    color: AlertItemColors.screenTitle,
  },
  list: { width: '100%' },
});
