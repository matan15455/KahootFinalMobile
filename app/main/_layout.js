// ===================================================================
// app/main/_layout.js — תפריט תחתון מותאם בסגנון EduPlay
// בר כהה צף עם פינות מעוגלות, אייקונים lime על active,
// כפתור פלוס סגול גדול ובולט במרכז ("צור חידון")
// ===================================================================
import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii } from '../../constants/theme';

const TAB_ITEMS = [
  { name: 'my-quizzes', label: 'החידונים', icon: 'library-outline'    },
  { name: 'join-room',  label: 'הצטרף',   icon: 'enter-outline'      },
  { name: 'create-quiz', label: 'צור',     icon: 'add',  big: true   },
  { name: 'profile',    label: 'פרופיל',  icon: 'person-outline'     },
];

// ─── רכיב Tab Bar מותאם ───────────────────────────────────
function EpTabBar({ state, navigation }) {
  return (
    <View pointerEvents="box-none" style={tabStyles.wrap}>
      <View style={tabStyles.bar}>
        {TAB_ITEMS.map((item) => {
          // index של הroute הזה בתוך state.routes
          const routeIndex = state.routes.findIndex(r => r.name === item.name);
          const isActive = state.index === routeIndex;

          const onPress = () => {
            if (routeIndex < 0) return;
            navigation.navigate(item.name);
          };

          // ── הכפתור הגדול במרכז (create) ──
          if (item.big) {
            return (
              <TouchableOpacity
                key={item.name}
                onPress={onPress}
                activeOpacity={0.85}
                style={tabStyles.bigBtn}
              >
                <Ionicons name={item.icon} size={28} color="#fff"/>
              </TouchableOpacity>
            );
          }

          // ── tab רגיל ──
          return (
            <TouchableOpacity
              key={item.name}
              onPress={onPress}
              activeOpacity={0.7}
              style={tabStyles.tab}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={isActive ? colors.ans3 : 'rgba(255,255,255,0.55)'}
              />
              <Text style={[
                tabStyles.label,
                { color: isActive ? colors.ans3 : 'rgba(255,255,255,0.55)' },
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <EpTabBar {...props}/>}
    >
      <Tabs.Screen name="my-quizzes"/>
      <Tabs.Screen name="join-room"/>
      <Tabs.Screen name="create-quiz"/>
      <Tabs.Screen name="profile"/>

      {/* מסכים מוסתרים — לא מופיעים ב-tab bar */}
      <Tabs.Screen name="create-manual" options={{ href: null }}/>
      <Tabs.Screen name="create-ai"     options={{ href: null }}/>
      <Tabs.Screen name="create-room"   options={{ href: null }}/>
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  // קונטיינר חיצוני — צף מעל המסך
  wrap: {
    position: 'absolute',
    left: 0, right: 0, bottom: Platform.OS === 'ios' ? 28 : 16,
    paddingHorizontal: 14,
  },
  // הבר עצמו
  bar: {
    backgroundColor: colors.ink,
    borderRadius: 26,
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 64,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4, paddingHorizontal: 10,
    gap: 2,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: '600',
  },
  // כפתור פלוס סגול גדול במרכז
  bigBtn: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ translateY: -14 }],
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 0,
    elevation: 8,
  },
});
