import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0d1025',
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: '#22d3ee',
        tabBarInactiveTintColor: 'rgba(234,240,255,0.4)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="my-quizzes"
        options={{
          title: 'השאלונים שלי',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="join-room"
        options={{
          title: 'הצטרף',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="enter-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-quiz"
        options={{
          title: 'צור שאלון',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'פרופיל',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />

      {/* מסכים נסתרים מה-tab bar */}
      <Tabs.Screen
        name="create-manual"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="create-ai"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="create-room"
        options={{ href: null }}
      />
    </Tabs>
  );
}