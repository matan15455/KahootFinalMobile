// ===================================================================
// app/main/create-quiz.js — EduPlay design (Quiz Creation Mode)
// תואם ל-QuizCreationMode.jsx של האתר
// 2 כרטיסים: ידני (paper + hex violet) / AI (ink + burst coral + lime CTA)
// ===================================================================
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, radii } from '../../constants/theme';
import { EpShape } from '../../components/EpBrand';

export default function CreateQuiz() {
  const router = useRouter();

  return (
    <ScrollView
      style={cqStyles.container}
      contentContainerStyle={cqStyles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={{ alignItems: 'center', marginBottom: 30 }}>
        <Text style={cqStyles.title}>בחר מה מתאים לך</Text>
        <Text style={cqStyles.sub}>
         אפשר להתחיל ידני, או לתת לAI להציע לכם שאלות לנושא שאתם בוחרים.
        </Text>
      </View>

      {/* ── Manual Card ── */}
      <TouchableOpacity
        style={cqStyles.cardManual}
        activeOpacity={0.85}
        onPress={() => router.push('/main/create-manual')}
      >
        <View style={cqStyles.art}>
          <View style={[cqStyles.shadowBlur, { backgroundColor: colors.ans2 }]}/>
          <EpShape kind="hex" size={56} color={colors.ans2}/>
        </View>

        <View style={{ gap: 12 }}>
          <Text style={cqStyles.cardTitle}>יצירה ידנית</Text>
          <Text style={cqStyles.cardDesc}>
           בנה את החידון שלך שאלה שאלה. שליטה מלאה בטקסט, בתשובות, בזמן ובניקוד של כל שאלה.
          </Text>


        </View>

        <View style={cqStyles.cardBtnGhost}>
          <Text style={cqStyles.cardBtnGhostText}>צור ידנית</Text>
        </View>
      </TouchableOpacity>

      {/* ── AI Card ── */}
      <TouchableOpacity
        style={cqStyles.cardAI}
        activeOpacity={0.9}
        onPress={() => router.push('/main/create-ai')}
      >

        <View style={cqStyles.art}>
          <View style={[cqStyles.shadowBlur, { backgroundColor: colors.ans1, opacity: 0.18 }]}/>
          <EpShape kind="burst" size={56} color={colors.ans1}/>
        </View>

        <View style={{ gap: 12 }}>
          <Text style={[cqStyles.cardTitle, { color: colors.paper }]}>יצירה עם AI</Text>
          <Text style={[cqStyles.cardDesc, { color: 'rgba(251,248,241,0.7)' }]}>
           בחר נושא והנחיות וה-AI ייצור בשבילך את השאלות
          </Text>

          <View style={{ gap: 6, marginTop: 6 }}>
            <Bullet text="חיסכון משמעותי בזמן" dark/>
            <Bullet text="ניסוח מקצועי" dark/>
            <Bullet text="ניתן לערוך הכול" dark/>
          </View>
        </View>

        <View style={cqStyles.cardBtnLime}>
          <Text style={cqStyles.cardBtnLimeText}>צור עם AI</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ── Bullet helper ────────────────────────────────────── */
function Bullet({ text, dark }) {
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
      <View style={[
        cqStyles.check,
        dark && { backgroundColor: 'rgba(184,225,66,0.22)' },
      ]}>
        <Text style={[
          cqStyles.checkText,
          dark && { color: colors.ans3 },
        ]}>✓</Text>
      </View>
      <Text style={[
        cqStyles.bulletText,
        dark && { color: 'rgba(251,248,241,0.8)' },
      ]}>{text}</Text>
    </View>
  );
}

const cqStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 60, paddingBottom: 120,
  },

  // ── Header ──
  kicker: {
    fontFamily: fonts.num, fontSize: 11, fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.inkMute, marginBottom: 8,
  },
  title: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 44, letterSpacing: -1, lineHeight: 46,
    color: colors.ink, marginBottom: 10, textAlign: 'center',
  },
  sub: {
    fontFamily: fonts.body, fontSize: 14, lineHeight: 22,
    color: colors.ink3, textAlign: 'center', maxWidth: 340,
  },

  // ── Card (shared) ──
  cardManual: {
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    borderRadius: radii.xl,
    padding: 26,
    marginBottom: 16,
    gap: 18,
    overflow: 'hidden',
  },
  cardAI: {
    backgroundColor: colors.ink,
    borderWidth: 1, borderColor: colors.ink,
    borderRadius: radii.xl,
    padding: 26,
    marginBottom: 16,
    gap: 18,
    overflow: 'hidden',
    position: 'relative',
  },

  tag: {
    position: 'absolute',
    top: 16, right: 18, zIndex: 2,
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: colors.paper,
    borderRadius: radii.pill,
  },
  tagText: {
    fontFamily: fonts.num, fontSize: 10, fontWeight: '700',
    letterSpacing: 0.6, color: colors.ink,
  },

  // Art zone (glyph + blur shadow)
  art: {
    height: 80, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  shadowBlur: {
    position: 'absolute',
    width: 110, height: 110, borderRadius: 55,
    opacity: 0.12,
  },

  cardTitle: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 26, letterSpacing: -0.6, color: colors.ink,
    textAlign: 'right',
  },
  cardDesc: {
    fontFamily: fonts.body, fontSize: 13.5, lineHeight: 21,
    color: colors.ink3, textAlign: 'right',
  },

  // Bullet
  check: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(30,158,95,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkText: { color: colors.ok, fontWeight: '900', fontSize: 11 },
  bulletText: {
    fontFamily: fonts.body, fontSize: 13, fontWeight: '500',
    color: colors.ink3,
  },

  // CTAs
  cardBtnGhost: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 20,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.12)',
    borderRadius: radii.pill,
  },
  cardBtnGhostText: {
    fontFamily: fonts.display, fontWeight: '700',
    fontSize: 15, color: colors.ink,
  },
  cardBtnLime: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13, paddingHorizontal: 20,
    backgroundColor: colors.ans3,
    borderRadius: radii.pill,
  },
  cardBtnLimeText: {
    fontFamily: fonts.display, fontWeight: '700',
    fontSize: 15, color: colors.ink,
  },
  arrow: { fontSize: 18, color: colors.ink, fontWeight: '700' },

  // Foot
  foot: {
    fontFamily: fonts.body, fontSize: 13,
    color: colors.inkMute, textAlign: 'center', marginTop: 8,
  },
});
