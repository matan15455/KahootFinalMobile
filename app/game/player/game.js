// ===================================================================
// app/game/player/game.js — EduPlay design
// תואם 1:1 ל-PlayerGame.jsx של האתר
// phases: LOADING / QUESTION / SUMMARY / SCORES / END
// עיצוב: cream/paper רקע, ANSWER_META tiles, verdict card, waiting pill
// ===================================================================
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getSocket } from '../../../utils/socket';
import { colors, fonts, radii } from '../../../constants/theme';
import { EpShape, ANSWER_META } from '../../../components/EpBrand';
import ScoreBoard from '../../../components/ScoreBoard';

const { width } = Dimensions.get('window');

/* ─────────────────────────────────────────────────────────
   Timer — קטן יותר מ-host, כמו .ep-pg__timer
───────────────────────────────────────────────────────── */
function TimerRing({ timeLeft, totalTime, size = 56 }) {
  const isDanger  = timeLeft !== null && timeLeft <= 5;
  const isWarning = timeLeft !== null && timeLeft > 5 && timeLeft <= 10;
  const progress  = totalTime > 0 ? timeLeft / totalTime : 0;

  const strokeColor = isDanger  ? colors.bad
                    : isWarning ? colors.warn
                    : colors.ink;

  return (
    <View style={[tr.wrap, { width: size, height: size }]}>
      <View style={[tr.bgRing, {
        width: size, height: size, borderRadius: size / 2,
        borderWidth: size * 0.08, borderColor: 'rgba(20,18,26,0.1)',
      }]} />
      <View style={[tr.progressRing, {
        width: size, height: size, borderRadius: size / 2,
        borderWidth: size * 0.08, borderColor: strokeColor,
        opacity: Math.max(0.15, progress),
      }]} />
      <Text style={[tr.num, { color: strokeColor, fontSize: size * 0.35 }]}>
        {timeLeft}
      </Text>
    </View>
  );
}

const tr = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  bgRing: { position: 'absolute', backgroundColor: 'transparent' },
  progressRing: { position: 'absolute', backgroundColor: 'transparent' },
  num: { fontFamily: fonts.num, fontWeight: '700' },
});

/* ─────────────────────────────────────────────────────────
   מסך ראשי
───────────────────────────────────────────────────────── */
export default function PlayerGame() {
  const [room,           setRoom]           = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft,       setTimeLeft]       = useState(null);
  const [earned,         setEarned]         = useState(null);

  const router     = useRouter();
  const { roomId } = useLocalSearchParams();
  const timerRef   = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !roomId) return;

    const handleRoomUpdated = (roomData) => {
      if (roomData.roomId !== roomId) return;
      setRoom(roomData);

      if (roomData.phase === 'QUESTION') {
        setSelectedAnswer(null);
        setEarned(null);
      }

      if (roomData.endsAt) {
        clearInterval(timerRef.current);
        const offset          = Date.now() - roomData.serverTime;
        const correctedEndsAt = roomData.endsAt + offset;

        const update = () => {
          const remaining = Math.max(0, Math.ceil((correctedEndsAt - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining <= 0) clearInterval(timerRef.current);
        };
        update();
        timerRef.current = setInterval(update, 250);
      } else {
        setTimeLeft(null);
        clearInterval(timerRef.current);
      }
    };

    const handleScoreEarned = ({ earned }) => setEarned(earned);

    socket.on('roomUpdated',  handleRoomUpdated);
    socket.on('scoreEarned',  handleScoreEarned);
    socket.emit('requestRoomState', { roomId });

    return () => {
      socket.off('roomUpdated',  handleRoomUpdated);
      socket.off('scoreEarned',  handleScoreEarned);
      clearInterval(timerRef.current);
    };
  }, [roomId]);

  const handleAnswer = (answerText) => {
    const socket = getSocket();
    if (!socket || !room || room.phase !== 'QUESTION') return;
    if (selectedAnswer) return;
    setSelectedAnswer(answerText);
    socket.emit('answerQuestion', { roomId, answerText });
  };

  /* ── Loading ── */
  if (!room) {
    return (
      <View style={[s.container, s.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loaderText}>טוען משחק…</Text>
      </View>
    );
  }

  /* ══════════════════════════════
     END
  ══════════════════════════════ */
  if (room.phase === 'END') {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.scrollContent}>
        <View style={s.heroSection}>
          <Text style={s.kicker}>סוף החידון</Text>
          <Text style={s.heroTitle}>
            כל הכבוד!{'\n'}
            <Text style={{ color: colors.primary }}>הנה התוצאות.</Text>
          </Text>
        </View>
        <ScoreBoard players={room.players} />
        <TouchableOpacity
          style={[s.waitPill, { marginTop: 24, alignSelf: 'center' }]}
          onPress={() => router.replace('/main/join-room')}
        >
          <Text style={s.waitPillText}>חזרה לדף הבית</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  /* ══════════════════════════════
     SUMMARY — תוצאה אישית + פירוט
  ══════════════════════════════ */
  if (room.phase === 'SUMMARY' && room.summary) {
    const entries      = Object.entries(room.summary.answersCount);
    const totalAnswers = entries.reduce((sum, [, c]) => sum + c, 0);
    const maxCount     = Math.max(...entries.map(([, c]) => c), 1);

    const wasCorrect = selectedAnswer && selectedAnswer === room.summary.correctAnswer;
    const wasWrong   = selectedAnswer && selectedAnswer !== room.summary.correctAnswer;

    return (
      <ScrollView style={s.container} contentContainerStyle={s.scrollContent}>

        {/* Verdict card — כמו .ep-pg__verdict */}
        <View style={[
          s.verdict,
          wasCorrect ? s.verdictCorrect : wasWrong ? s.verdictWrong : s.verdictNeutral,
        ]}>
          <Text style={s.verdictLabel}>
            {wasCorrect ? 'תשובה נכונה!' : wasWrong ? 'תשובה שגויה' : 'לא ענית בזמן'}
          </Text>
          <Text style={s.verdictSub}>
            {wasCorrect && (
              <>
                מהיר ומדויק. ✦
                {earned !== null ? `  +${earned} נק'` : ''}
              </>
            )}
            {wasWrong   && `התשובה הנכונה: ${room.summary.correctAnswer}`}
            {!selectedAnswer && `התשובה הנכונה: ${room.summary.correctAnswer}`}
          </Text>
        </View>

        {/* פירוט — כמו .ep-pg__sum-wrap */}
        <View style={s.sumWrap}>
          <Text style={s.sumLabel}>איך הצביעו אחרים</Text>
          {entries.map(([answer, count], idx) => {
            const meta      = ANSWER_META[idx % ANSWER_META.length];
            const isCorrect = room.summary.correctAnswer === answer;
            const isMine    = selectedAnswer === answer;
            const pct       = totalAnswers ? (count / totalAnswers) * 100 : 0;
            const barPct    = (count / maxCount) * 100;

            return (
              <View key={answer} style={[
                s.sumRow,
                isCorrect ? s.sumRowCorrect : isMine && !isCorrect ? s.sumRowWrong : null,
              ]}>
                <View style={[s.sumTag, { backgroundColor: meta.color }]}>
                  <Text style={[s.sumTagText, { color: meta.textOn || '#fff' }]}>{meta.letter}</Text>
                </View>
                <View style={s.sumBody}>
                  <View style={s.sumHead}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Text style={s.sumText} numberOfLines={2}>{answer}</Text>
                      {isCorrect && (
                        <View style={s.badgeOk}><Text style={s.badgeOkText}>✓ נכון</Text></View>
                      )}
                      {isMine && (
                        <View style={s.badgeMine}><Text style={s.badgeMineText}>הבחירה שלך</Text></View>
                      )}
                    </View>
                    <View style={s.sumCountWrap}>
                      <Text style={s.sumCount}>{count}</Text>
                      <Text style={s.sumPct}> · {Math.round(pct)}%</Text>
                    </View>
                  </View>
                  <View style={s.barTrack}>
                    <View style={[s.barFill, { width: `${barPct}%`, backgroundColor: meta.color }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* waiting pill */}
        <View style={[s.waitPill, { alignSelf: 'center' }]}>
          <View style={s.pulseDot} />
          <Text style={s.waitPillText}>ממתינים שהמנחה ימשיך…</Text>
        </View>
      </ScrollView>
    );
  }

  /* ══════════════════════════════
     SCORES — לוח ניקוד
  ══════════════════════════════ */
  if (room.phase === 'SCORES') {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.scrollContent}>
        <View style={s.topSection}>
          <Text style={s.kicker}>לוח ניקוד</Text>
          <Text style={s.sectionTitle}>המצב הנוכחי</Text>
        </View>
        <ScoreBoard players={room.players} />
        <View style={[s.waitPill, { alignSelf: 'center', marginTop: 20 }]}>
          <View style={s.pulseDot} />
          <Text style={s.waitPillText}>ממתינים שהמנחה ימשיך…</Text>
        </View>
      </ScrollView>
    );
  }

  /* ══════════════════════════════
     QUESTION
  ══════════════════════════════ */
  if (room.phase === 'QUESTION' && room.question) {
    const totalQ = room.questions?.length || room.question.totalQuestions;

    return (
      <View style={[s.container, s.qFull]}>

        {/* ── ראש: chip + timer ── */}
        <View style={s.qhead}>
          <View style={s.chip}>
            <Text style={s.chipText}>
              שאלה {room.questionIndex + 1}
              {totalQ ? ` · מתוך ${totalQ}` : ''}
            </Text>
          </View>
          {timeLeft !== null && (
            <TimerRing
              timeLeft={timeLeft}
              totalTime={room.question.time}
              size={56}
            />
          )}
        </View>

        {/* ── hint card ── */}
        <View style={s.hintCard}>
          <Text style={s.hintLabel}>
            {selectedAnswer ? 'תשובתך נשלחה' : 'בחרו תשובה'}
          </Text>
          {selectedAnswer && (
            <Text style={s.hintSub}>המתינו שהמנחה יסיים את השאלה</Text>
          )}
        </View>

        {/* ── 4 כפתורי תשובה ── */}
        <View style={s.answersGrid}>
          {room.question.answers.map((ans, idx) => {
            const meta       = ANSWER_META[idx % ANSWER_META.length];
            const isSelected = selectedAnswer === ans.text;
            const isDimmed   = selectedAnswer && !isSelected;

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                style={[
                  s.answerBtn,
                  { backgroundColor: meta.color, shadowColor: meta.inkColor },
                  isSelected && s.answerBtnSelected,
                  isDimmed   && s.answerBtnDimmed,
                ]}
                onPress={() => handleAnswer(ans.text)}
                disabled={!!selectedAnswer}
              >
                <View style={s.answerBtnTop}>
                  <Text style={[s.answerLetter, { color: meta.textOn || '#fff' }]}>
                    {meta.letter}
                  </Text>
                  <EpShape kind={meta.shape} size={22} color={meta.textOn || '#fff'} />
                </View>
                <Text style={[s.answerText, { color: meta.textOn || '#fff' }]}>
                  {ans.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  /* ── Fallback ── */
  return (
    <View style={[s.container, s.centered]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={s.loaderText}>מחכים שהמנחה יתחיל…</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.cream, paddingTop: 60,
  },
  qFull: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 60, gap: 16 },

  loaderText: {
    fontFamily: fonts.num, fontSize: 13, fontWeight: '500',
    letterSpacing: 0.08, textTransform: 'uppercase',
    color: colors.inkMute, marginTop: 16, textAlign: 'center',
  },

  // ── Hero ──
  heroSection: { alignItems: 'center', gap: 10 },
  heroTitle: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 36, letterSpacing: -0.03, lineHeight: 40,
    color: colors.ink, textAlign: 'center',
  },
  topSection: { gap: 6 },
  kicker: {
    fontFamily: fonts.num, fontSize: 12, fontWeight: '600',
    letterSpacing: 0.08, textTransform: 'uppercase',
    color: colors.inkMute, textAlign: 'right',
  },
  sectionTitle: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 28, letterSpacing: -0.025, color: colors.ink, textAlign: 'right',
  },

  // ── Verdict (SUMMARY) ──
  verdict: {
    padding: 22, borderRadius: radii.xl, gap: 8,
  },
  verdictCorrect: {
    backgroundColor: colors.ans3,
    shadowColor: colors.ans3Ink,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  verdictWrong: {
    backgroundColor: colors.ans1,
    shadowColor: colors.ans1Ink,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  verdictNeutral: {
    backgroundColor: colors.ink,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  verdictLabel: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 28, letterSpacing: -0.02, lineHeight: 30, color: '#fff',
  },
  verdictSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  // ── Summary list ──
  sumWrap: {
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    borderRadius: radii.xl, padding: 16, gap: 8,
  },
  sumLabel: {
    fontFamily: fonts.num, fontSize: 12, fontWeight: '600',
    letterSpacing: 0.08, textTransform: 'uppercase',
    color: colors.inkMute, textAlign: 'right', marginBottom: 6,
  },
  sumRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    padding: 10, borderRadius: radii.md,
    borderWidth: 1, borderColor: 'transparent',
  },
  sumRowCorrect: { borderColor: colors.ok, backgroundColor: 'rgba(30,158,95,0.06)' },
  sumRowWrong:   { borderColor: colors.bad, backgroundColor: 'rgba(214,58,45,0.06)' },
  sumTag: {
    width: 34, height: 34, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sumTagText: { fontFamily: fonts.display, fontWeight: '800', fontSize: 17 },
  sumBody: { flex: 1, gap: 6 },
  sumHead: {
    flexDirection: 'row-reverse', alignItems: 'baseline',
    justifyContent: 'space-between', gap: 8,
  },
  sumText: {
    fontFamily: fonts.display, fontWeight: '700',
    fontSize: 14, color: colors.ink, textAlign: 'right',
  },
  badgeOk: {
    paddingHorizontal: 7, paddingVertical: 2,
    backgroundColor: 'rgba(30,158,95,0.14)', borderRadius: radii.pill,
  },
  badgeOkText: { fontFamily: fonts.num, fontSize: 10.5, fontWeight: '700', color: colors.ok },
  badgeMine: {
    paddingHorizontal: 7, paddingVertical: 2,
    backgroundColor: 'rgba(79,63,245,0.12)', borderRadius: radii.pill,
  },
  badgeMineText: { fontFamily: fonts.num, fontSize: 10.5, fontWeight: '700', color: colors.primary },
  sumCountWrap: { flexDirection: 'row', alignItems: 'baseline', flexShrink: 0 },
  sumCount: { fontFamily: fonts.num, fontWeight: '700', fontSize: 18, color: colors.ink },
  sumPct: { fontFamily: fonts.num, fontSize: 11, color: colors.inkMute },
  barTrack: { height: 6, backgroundColor: 'rgba(20,18,26,0.06)', borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },

  // ── Waiting pill ──
  waitPill: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 18,
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.08)',
    borderRadius: radii.pill,
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  waitPillText: { fontSize: 13.5, fontWeight: '600', color: colors.ink3 },

  // ── QUESTION ──
  qhead: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, marginBottom: 12, gap: 10,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: colors.ink, borderRadius: radii.pill,
  },
  chipText: { color: colors.paper, fontFamily: fonts.display, fontWeight: '700', fontSize: 13 },

  hintCard: {
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    borderRadius: radii.md, marginHorizontal: 16, marginBottom: 12,
    gap: 2,
  },
  hintLabel: { fontFamily: fonts.display, fontWeight: '700', fontSize: 15, color: colors.ink, textAlign: 'right' },
  hintSub: { fontSize: 13, color: colors.ink3, textAlign: 'right' },

  answersGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10, flex: 1,
    alignContent: 'flex-start',
  },
  answerBtn: {
    width: (width - 42) / 2,
    minHeight: 110,
    borderRadius: radii.lg,
    padding: 16,
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  answerBtnSelected: {
    transform: [{ translateY: 2 }],
    shadowOffset: { width: 0, height: 0 },
    opacity: 1,
    borderWidth: 4, borderColor: colors.ink,
  },
  answerBtnDimmed: { opacity: 0.35, transform: [{ scale: 0.97 }] },
  answerBtnTop: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  answerLetter: { fontFamily: fonts.display, fontWeight: '800', fontSize: 32, lineHeight: 34 },
  answerText: {
    fontFamily: fonts.display, fontWeight: '700',
    fontSize: 15, lineHeight: 19, textAlign: 'right', marginTop: 6,
  },
});