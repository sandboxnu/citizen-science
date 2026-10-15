import { Redirect } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarButton } from '@/components/tab-bar-button';
import { NavBarColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function TabsLayout() {
  const { user, initializing } = useAuth();
  const insets = useSafeAreaInsets();

  if (initializing) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Tabs style={styles.container}>
      <TabSlot />
      <TabList style={[styles.bar, { paddingBottom: insets.bottom + Spacing.two }]}>
        <TabTrigger name="index" href="/" asChild>
          <TabBarButton label="Map" icon={require('@/assets/images/navIcons/map.svg')} />
        </TabTrigger>
        <TabTrigger name="feed" href="/feed" asChild>
          <TabBarButton label="Feed" icon={require('@/assets/images/navIcons/feed.svg')} />
        </TabTrigger>
        <TabTrigger name="report" href="/report" asChild>
          <TabBarButton label="Report" icon={require('@/assets/images/navIcons/report.svg')} variant="action" />
        </TabTrigger>
        <TabTrigger name="alerts" href="/alerts" asChild>
          <TabBarButton label="Alerts" icon={require('@/assets/images/navIcons/alerts.svg')} />
        </TabTrigger>
        <TabTrigger name="profile" href="/profile" asChild>
          <TabBarButton label="Profile" icon={require('@/assets/images/navIcons/profile.svg')} />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.three,
    paddingHorizontal: 20,
    backgroundColor: NavBarColors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: NavBarColors.border,
  },
});
