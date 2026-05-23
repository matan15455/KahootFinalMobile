// ===================================================================
// EpQuizCard — כרטיס חידון בודד עם פס צבע עליון
// תאום ל-QuizCard.jsx של האתר
// ===================================================================
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, radii } from '../constants/theme';
import { EpShape, ANSWER_META } from './EpBrand';

export default function EpQuizCard({ quiz, colorIndex = 0, onPress, onDelete }) {
  const meta = ANSWER_META[colorIndex % ANSWER_META.length];
  const count = quiz.questions?.length || 0;
  const ink = meta.color === colors.ans3 ? colors.ink : '#fff';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={cardStyles.card}
    >
      {/* ── פס צבעוני עליון ── */}
      <View style={[cardStyles.band, { backgroundColor: meta.color }]}>
        {/* צורה דקורטיבית גדולה ברקע */}
        <View style={cardStyles.bandBg}>
          <EpShape kind={meta.shape} color={ink} size={170}/>
        </View>

        {/* tag עם מספר שאלות */}
        <View style={cardStyles.bandTag}>
          <Text style={[cardStyles.bandTagText, { color: ink }]}>
            {count} {count === 1 ? 'שאלה' : 'שאלות'}
          </Text>
        </View>

        {/* glyph קטן מימין */}
        <View style={cardStyles.bandGlyph}>
          <EpShape kind={meta.shape} color={ink} size={26}/>
        </View>
      </View>

      {/* ── גוף ── */}
      <View style={cardStyles.body}>
        <Text style={cardStyles.title} numberOfLines={2}>
          {quiz.title}
        </Text>
        <Text style={cardStyles.desc} numberOfLines={2}>
          {quiz.description || 'ללא תיאור'}
        </Text>

        <View style={cardStyles.foot}>
          <View style={cardStyles.action}>
            <Text style={cardStyles.actionText}>הפעל חדר</Text>
            <Text style={cardStyles.arrow}>←</Text>
          </View>
          {onDelete && (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); onDelete(quiz._id); }}
              style={cardStyles.delete}
            >
              <Text style={cardStyles.deleteText}>מחק</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(20,18,26,0.06)',
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // ── Band (פס צבעוני) ──
  band: {
    height: 96,
    paddingHorizontal: 18,
    paddingVertical: 14,
    position: 'relative',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  bandBg: {
    position: 'absolute',
    bottom: -50,
    left: -25,
    opacity: 0.15,
  },
  bandTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radii.pill,
  },
  bandTagText: {
    fontFamily: fonts.num,
    fontSize: 12,
    fontWeight: '700',
  },
  bandGlyph: { opacity: 0.95 },

  // ── Body ──
  body: { padding: 18, gap: 8 },
  title: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 17,
    lineHeight: 21,
    letterSpacing: -0.3,
    color: colors.ink,
    textAlign: 'right',
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink3,
    textAlign: 'right',
  },

  foot: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(20,18,26,0.06)',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  action: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 14,
    color: colors.ink,
  },
  arrow: { fontSize: 18, color: colors.ink },

  delete: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(214,58,45,0.25)',
    borderRadius: radii.pill,
  },
  deleteText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '600',
    color: colors.bad,
  },
});
