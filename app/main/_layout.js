import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors, fonts, radii } from '../../constants/theme';

const TAB_ITEMS = [
  { name: 'my-quizzes',  label: 'חידונים', icon: '🃏' },
  { name: 'create-quiz', label: 'צור',     icon: '+',  big: true },
  { name: 'join-room',   label: 'הצטרף',   icon: '▶' },
  { name: 'statistics',  label: 'סטטיסטיקות', icon: '📊' },
  { name: 'profile',     label: 'אישי',    icon: '👤' },
];

function EpTabBar({ state, descriptors, navigation }) {
  return (
    <View style={tb.wrap}>
      <View style={tb.bar}>
        {state.routes
          .filter(r => !['create-room', 'create-manual', 'create-ai', 'session'].includes(r.name))
          .map((route) => {
            const meta        = TAB_ITEMS.find(t => t.name === route.name);
            if (!meta) return null;
            const isFocused   = state.index === state.routes.indexOf(route);
            const onPress     = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            if (meta.big) {
              return (
                <TouchableOpacity key={route.name} style={tb.bigBtnWrap} onPress={onPress} activeOpacity={0.8}>
                  <View style={tb.bigBtn}>
                    <Text style={tb.bigBtnText}>{meta.icon}</Text>
                  </View>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity key={route.name} style={tb.item} onPress={onPress} activeOpacity={0.75}>
                <Text style={[tb.icon, isFocused && tb.iconActive]}>{meta.icon}</Text>
                <Text style={[tb.label, isFocused && tb.labelActive]}>{meta.label}</Text>
                {isFocused && <View style={tb.dot} />}
              </TouchableOpacity>
            );
          })}
      </View>
    </View>
  );
}

export default function MainLayout() {
  return (
    <Tabs tabBar={(props) => <EpTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="my-quizzes"  />
      <Tabs.Screen name="join-room"   />
      <Tabs.Screen name="create-quiz" />
      <Tabs.Screen name="create-room" options={{ href: null }} />
      <Tabs.Screen name="create-manual" options={{ href: null }} />
      <Tabs.Screen name="create-ai"   options={{ href: null }} />
      <Tabs.Screen name="statistics"  />
      <Tabs.Screen name="session"     options={{ href: null }} />
      <Tabs.Screen name="profile"     />
    </Tabs>
  );
}

/* ── Styles ── */
const tb = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.paper,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(20,18,26,0.06)',
  },

  item: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 3, paddingVertical: 6, paddingHorizontal: 6,
    borderRadius: radii.lg, position: 'relative',
  },
  icon: { fontSize: 20, opacity: 0.4 },
  iconActive: { opacity: 1 },
  label: {
    fontFamily: fonts.num, fontSize: 10, fontWeight: '600',
    color: colors.inkMute, letterSpacing: 0.3,
  },
  labelActive: { color: colors.ink, fontWeight: '700' },
  dot: {
    position: 'absolute', bottom: 2,
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.primary,
  },

  bigBtnWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  bigBtn: {
    width: 52, height: 52, borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 6,
  },
  bigBtnText: { fontSize: 28, color: '#fff', lineHeight: 34, fontWeight: '900' },
});