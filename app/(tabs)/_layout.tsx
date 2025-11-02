import { AnimatedTabBar } from '@/components/AnimatedTabBar';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'QUEST',
        }}
      />
      <Tabs.Screen
        name="extras"
        options={{
          title: 'EXTRAS',
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: '1V1',
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'TIENDA',
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: 'PERFIL',
        }}
      />
    </Tabs>
  );
}
