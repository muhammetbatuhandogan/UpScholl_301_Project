import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { palette } from '@/ui/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

function tabIcon(focusedName: IoniconName, outlineName: IoniconName) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? focusedName : outlineName} size={size} color={color} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: palette.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Panel', tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="onboarding"
        options={{ title: 'Profil', tabBarIcon: tabIcon('person-circle', 'person-circle-outline') }}
      />
      <Tabs.Screen
        name="bag"
        options={{ title: 'Çanta', tabBarIcon: tabIcon('bag-handle', 'bag-handle-outline') }}
      />
      <Tabs.Screen
        name="family"
        options={{ title: 'Aile', tabBarIcon: tabIcon('people', 'people-outline') }}
      />
      <Tabs.Screen
        name="emergency"
        options={{ title: 'Acil', tabBarIcon: tabIcon('alert-circle', 'alert-circle-outline') }}
      />
    </Tabs>
  );
}
