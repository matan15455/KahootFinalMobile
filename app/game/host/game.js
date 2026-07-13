import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getSocket } from '../../../utils/socket';
import * as Speech from 'expo-speech';
import { colors, fonts, radii } from '../../../constants/theme';
import { EpShape, ANSWER_META } from '../../../components/EpBrand';
import ScoreBoard from '../../../components/ScoreBoard';

const { width } = Dimensions.get('window');

function TimerRing({ timeLeft, totalTime, size = 120 }) {
  const r         = 45;
  const circ      = 2 * Math.PI * r; 
  const progress  = totalTime > 0 ? timeLeft / totalTime : 0;
  const offset    = circ - progress * circ;

  const isDanger  = timeLeft !== null && timeLeft <= 5;
  const isWarning = timeLeft !== null && timeLeft > 5 && timeLeft <= 10;

  const strokeColor = isDanger  ? colors.bad
                    : isWarning ? colors.warn
                    : colors.ink;
  const numColor    = isDanger  ? colors.bad
                    : isWarning ? colors.warn
                    : colors.ink;

  return (
    <View style={[timerStyles.wrap, { width: size, height: size }]}>
      {/* SVG via View trick — use raw SVG string rendered as a component */}
      <View style={[timerStyles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
        {/* bg ring */}
        <View style={[timerStyles.bgRing, {
          width: size, height: size, borderRadius: size / 2,
          borderWidth: size * 0.07,
          borderColor: 'rgba(20,18,26,0.1)',
        }]} />
        {/* progress arc — approximate with border */}
        <View style={[timerStyles.progressRing, {
          width: size, height: size, borderRadius: size / 2,
          borderWidth: size * 0.07,
          borderColor: strokeColor,
          opacity: progress,
        }]} />
      </View>
      <Text style={[timerStyles.num, { color: numColor, fontSize: size * 0.36 }]}>
        {timeLeft}
      </Text>
    </View>
  );
}

const timerStyles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  ring: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  bgRing: { position: 'absolute', backgroundColor: 'transparent' },
  progressRing: { position: 'absolute', backgroundColor: 'transparent' },
  num: { fontFamily: fonts.num, fontWeight: '700', lineHeight: undefined },
});

/* ─────────────────────────────────────────────────────────
   מסך ראשי
───────────────────────────────────────────────────────── */
export default function HostGame() {
  const [room,     setRoom]     = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const router    = useRouter();
  const { roomId } = useLocalSearchParams();
  const timerRef  = useRef(null);
  const endAnnouncedRef = useRef(false);


  useEffect(() => {
    const socket = getSocket();
    if (!socket || !roomId) return;

    const handleRoomUpdated = (roomData) => {
      if (roomData.roomId !== roomId) return;
      setRoom(roomData);

     if (roomData.phase === 'END' && !endAnnouncedRef.current) {
        endAnnouncedRef.current = true;
        Speech.stop();
        Speech.speak('החידון הסתיים', {
          language: 'he-IL',
          onError: (err) => console.warn('Speech error:', err),
        });
      }

      if (roomData.endsAt) {
        clearInterval(timerRef.current);
        const offset         = Date.now() - roomData.serverTime;
        const correctedEndsAt = roomData.endsAt + offset;

        const update = () => {
          const remaining = Math.max(0, Math.ceil((correctedEndsAt - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining <= 0) {
            clearInterval(timerRef.current);
          }
        };
        update();
        timerRef.current = setInterval(update, 250);
      } else {
        setTimeLeft(null);
        clearInterval(timerRef.current);
      }
    };

    socket.on('roomUpdated', handleRoomUpdated);
    socket.emit('requestRoomState', { roomId });

    return () => {
      socket.off('roomUpdated', handleRoomUpdated);
      clearInterval(timerRef.current);
      Speech.stop();
    };
  }, [roomId]);

  const handleNext = () => {
    const socket = getSocket();
    if (!socket || !room) return;
    socket.emit('nextQuestion', { roomId });
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
           <Text style={{ color: colors.primary }}>הזוכים</Text>
          </Text>
        </View>
        <ScoreBoard players={room.players} />
        <TouchableOpacity
          style={[s.nextBtn, { marginTop: 24 }]}
          onPress={() => router.replace('/main/my-quizzes')}
        >
          <Text style={s.nextBtnText}>חזרה לחידונים</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  /* ══════════════════════════════
     SUMMARY — סיכום שאלה
     bar chart כמו .ep-host__sum באתר
  ══════════════════════════════ */
  if (room.phase === 'SUMMARY' && room.summary) {
    const entries      = Object.entries(room.summary.answersCount);
    const totalAnswers = entries.reduce((sum, [, c]) => sum + c, 0);
    const maxCount     = Math.max(...entries.map(([, c]) => c), 1);

    return (
      <ScrollView style={s.container} contentContainerStyle={s.scrollContent}>
        <View style={s.topSection}>
          <Text style={s.kicker}>סיכום</Text>
          <Text style={s.sectionTitle}>תוצאות השאלה</Text>
          <Text style={s.sectionSub}>
            {totalAnswers} שחקנים ענו 
          </Text>
        </View>

        {/* רשימת תשובות עם bar */}
        <View style={s.sumList}>
          {entries.map(([answer, count], idx) => {
            const meta      = ANSWER_META[idx % ANSWER_META.length];
            const isCorrect = room.summary.correctAnswer === answer;
            const pct       = totalAnswers ? (count / totalAnswers) * 100 : 0;
            const barPct    = (count / maxCount) * 100;

            return (
              <View
                key={answer}
                style={[s.sumRow, isCorrect && s.sumRowCorrect]}
              >
                {/* letter tag */}
                <View style={[s.sumTag, { backgroundColor: meta.color }]}>
                  <Text style={[s.sumTagText, { color: meta.textOn || '#fff' }]}>
                    {meta.letter}
                  </Text>
                </View>

                <View style={s.sumBody}>
                  <View style={s.sumHead}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                      <Text style={s.sumText} numberOfLines={2}>{answer}</Text>
                      {isCorrect && (
                        <View style={s.correctBadge}>
                          <Text style={s.correctBadgeText}>✓ נכון</Text>
                        </View>
                      )}
                    </View>
                    <View style={s.sumCountWrap}>
                      <Text style={s.sumCount}>{count}</Text>
                      <Text style={s.sumPct}> · {Math.round(pct)}%</Text>
                    </View>
                  </View>

                  {/* bar */}
                  <View style={s.barTrack}>
                    <View style={[s.barFill, {
                      width: `${barPct}%`,
                      backgroundColor: meta.color,
                    }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
          <Text style={s.nextBtnText}>הצג ניקוד</Text>
        </TouchableOpacity>
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
          <Text style={s.kicker}> ניקוד</Text>
          <Text style={s.sectionTitle}>המצב הנוכחי</Text>
        </View>
        <ScoreBoard players={room.players} />
        <TouchableOpacity style={[s.nextBtn, { marginTop: 24 }]} onPress={handleNext}>
          <Text style={s.nextBtnText}>המשך</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  /* ══════════════════════════════
     QUESTION — שאלה חיה
  ══════════════════════════════ */
  if (room.phase === 'QUESTION' && room.question) {
    const totalQ   = room.questions?.length || room.question.totalQuestions;

    return (
      <View style={s.container}>
        {/* ── ראש: chip שאלה + timer + כפתור סיים ── */}
        <View style={s.qhead}>
          <View style={s.qheadLeft}>
            <View style={s.chip}>
              <Text style={s.chipText}>
                שאלה {room.questionIndex + 1}
                {totalQ ? ` · מתוך ${totalQ}` : ''}
              </Text>
            </View>
          </View>

          {timeLeft !== null && (
            <TimerRing
              timeLeft={timeLeft}
              totalTime={room.question.time}
              size={100}
            />
          )}

          <View style={s.qheadRight}>
            <TouchableOpacity style={s.skipBtn} onPress={handleNext}>
              <Text style={s.skipBtnText}>סיים שאלה </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── כרטיס שאלה ── */}
        <View style={s.qbox}>
          <Text style={s.qtext}>{room.question.text}</Text>
        </View>

        {/* ── 4 תשובות ── */}
        <View style={s.answersGrid}>
          {room.question.answers.map((ans, idx) => {
            const meta = ANSWER_META[idx % ANSWER_META.length];
            return (
              <View
                key={idx}
                style={[s.answerTile, {
                  backgroundColor: meta.color,
                  shadowColor: meta.inkColor,
                }]}
              >
                <View style={s.answerTileTop}>
                  <Text style={[s.answerLetter, { color: meta.textOn || '#fff' }]}>
                    {meta.letter}
                  </Text>
                  <EpShape kind={meta.shape} size={26} color={meta.textOn || '#fff'} />
                </View>
                <Text style={[s.answerText, { color: meta.textOn || '#fff' }]}>
                  {ans.text}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  /* ── Fallback / Lobby ── */
  return (
    <View style={[s.container, s.centered]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={s.loaderText}>ממתין לתחילת המשחק…</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingTop: 60,
  },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },

  loaderText: {
    fontFamily: fonts.num, fontSize: 13, fontWeight: '500',
    letterSpacing: 0.08, textTransform: 'uppercase',
    color: colors.inkMute, marginTop: 16,
  },

  // ── Hero sections ──
  heroSection: {
    alignItems: 'center', marginBottom: 28, gap: 10,
  },
  heroTitle: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 40, letterSpacing: -0.03, lineHeight: 42,
    color: colors.ink, textAlign: 'center',
  },
  topSection: { marginBottom: 22 },
  kicker: {
    fontFamily: fonts.num, fontSize: 12, fontWeight: '600',
    letterSpacing: 0.08, textTransform: 'uppercase',
    color: colors.inkMute, marginBottom: 6,
    textAlign: 'right',
  },
  sectionTitle: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 36, letterSpacing: -0.025, lineHeight: 38,
    color: colors.ink, textAlign: 'right',
  },
  sectionSub: {
    fontSize: 15, color: colors.ink3,
    textAlign: 'right', marginTop: 4,
  },

  // ── SUMMARY bar rows ──
  sumList: { gap: 10, marginBottom: 24 },
  sumRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    padding: 16,
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    borderRadius: radii.lg,
  },
  sumRowCorrect: {
    borderColor: colors.ok,
    backgroundColor: 'rgba(30,158,95,0.06)',
  },
  sumTag: {
    width: 44, height: 44, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  sumTagText: { fontFamily: fonts.display, fontWeight: '800', fontSize: 22 },
  sumBody: { flex: 1, gap: 8 },
  sumHead: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: 8,
  },
  sumText: {
    fontFamily: fonts.display, fontWeight: '700',
    fontSize: 16, color: colors.ink, flex: 1, textAlign: 'right',
  },
  correctBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: 'rgba(30,158,95,0.12)',
    borderRadius: radii.pill,
  },
  correctBadgeText: {
    fontFamily: fonts.num, fontSize: 11, fontWeight: '700',
    color: colors.ok, letterSpacing: 0.04,
  },
  sumCountWrap: { flexDirection: 'row', alignItems: 'baseline', flexShrink: 0 },
  sumCount: { fontFamily: fonts.num, fontWeight: '700', fontSize: 22, color: colors.ink },
  sumPct: { fontFamily: fonts.num, fontSize: 13, color: colors.inkMute },
  barTrack: {
    height: 8, backgroundColor: 'rgba(20,18,26,0.06)',
    borderRadius: 999, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 999 },

  // ── Next button ──
  nextBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 14, paddingHorizontal: 28,
    backgroundColor: colors.ink, borderRadius: radii.pill,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 5,
    alignSelf: 'center',
  },
  nextBtnText: { color: colors.paper, fontFamily: fonts.display, fontSize: 16, fontWeight: '700' },
  nextBtnArrow: { color: colors.paper, fontSize: 18 },

  // ── QUESTION header ──
  qhead: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  qheadLeft: { flex: 1, alignItems: 'flex-end' },
  qheadRight: { flex: 1, alignItems: 'flex-start' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: colors.ink, borderRadius: radii.pill,
  },
  chipText: { color: colors.paper, fontFamily: fonts.display, fontWeight: '700', fontSize: 14 },
  skipBtn: {
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.12)',
    borderRadius: radii.pill,
  },
  skipBtnText: { fontFamily: fonts.display, fontWeight: '700', fontSize: 13, color: colors.ink },

  // ── Question card ──
  qbox: {
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    borderRadius: radii.xl,
    paddingVertical: 32, paddingHorizontal: 28,
    marginHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 140,
  },
  qtext: {
    fontFamily: fonts.display, fontWeight: '700',
    fontSize: 28, lineHeight: 34, letterSpacing: -0.02,
    color: colors.ink, textAlign: 'center',
  },

  // ── Answer tiles ──
  answersGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 20, gap: 12,
  },
  answerTile: {
    width: (width - 52) / 2,
    minHeight: 100,
    borderRadius: radii.lg,
    padding: 18,
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1, shadowRadius: 0,
    elevation: 5,
  },
  answerTileTop: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  answerLetter: { fontFamily: fonts.display, fontWeight: '800', fontSize: 36, lineHeight: 38 },
  answerText: {
    fontFamily: fonts.display, fontWeight: '700',
    fontSize: 18, lineHeight: 22, textAlign: 'right', marginTop: 8,
  },
});