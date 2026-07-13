import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { SERVER_URL } from '../../utils/socket';
import { colors, fonts, radii } from '../../constants/theme';
import { ANSWER_META } from '../../components/EpBrand';

const TABS = [
  { key: 'overview',  label: 'סקירה' },
  { key: 'players',   label: 'שחקנים' },
  { key: 'questions', label: 'שאלות' },
];

export default function SessionView() {
  const { id: sessionId } = useLocalSearchParams();
  const { token }         = useAuth();
  const router            = useRouter();

  const [session,          setSession]          = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [tab,              setTab]              = useState('overview');
  const [selectedPlayer,   setSelectedPlayer]   = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${SERVER_URL}/stats/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSession(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [sessionId, token]);

  /* ── חישובים גלובליים ── */
  const computed = useMemo(() => {
    if (!session) return null;

    const sorted = [...session.players].sort((a, b) => b.score - a.score);

    const questionInsights = session.questions.map((q, qIdx) => {
      const counts = {};
      let correctAnswerText = null;

      session.players.forEach((p) => {
        const ans = p.answers.find((a) => a.questionIndex === qIdx);
        if (!ans) return;
        counts[ans.answered] = (counts[ans.answered] || 0) + 1;
        if (ans.isCorrect && !correctAnswerText) correctAnswerText = ans.answered;
      });

      const times = [];
      session.players.forEach((p) => {
        const ans = p.answers.find((a) => a.questionIndex === qIdx);
        if (ans && typeof ans.timeToAnswer === 'number') times.push(ans.timeToAnswer);
      });
      const avgTime = times.length > 0
        ? Math.round((times.reduce((s, t) => s + t, 0) / times.length) * 10) / 10
        : null;

      const correctPct = q.totalAnswered > 0
        ? Math.round((q.totalCorrect / q.totalAnswered) * 100) : 0;

      return { index: qIdx, question: q, counts, correctAnswerText, avgTime, correctPct };
    });

    const sortedByDiff = [...questionInsights]
      .filter(q => q.question.totalAnswered > 0)
      .sort((a, b) => a.correctPct - b.correctPct);
    const hardest = sortedByDiff[0] || null;
    const easiest = sortedByDiff[sortedByDiff.length - 1] || null;

    const allTimes = session.players.flatMap(p =>
      p.answers.filter(a => typeof a.timeToAnswer === 'number').map(a => a.timeToAnswer)
    );
    const avgTimeAll = allTimes.length > 0
      ? Math.round((allTimes.reduce((s, t) => s + t, 0) / allTimes.length) * 10) / 10 : null;

    const avgScore = sorted.length > 0
      ? Math.round(sorted.reduce((s, p) => s + p.score, 0) / sorted.length) : 0;

    const totalCorrect    = session.questions.reduce((s, q) => s + q.totalCorrect, 0);
    const totalAnsweredAll = session.questions.reduce((s, q) => s + q.totalAnswered, 0);
    const overallCorrectPct = totalAnsweredAll > 0
      ? Math.round((totalCorrect / totalAnsweredAll) * 100) : 0;

    return { sorted, questionInsights, hardest, easiest, avgTimeAll, avgScore, overallCorrectPct };
  }, [session]);

  if (loading) {
    return (
      <View style={[s.container, s.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[s.container, s.centered]}>
        <Text style={s.notFound}>המשחק לא נמצא</Text>
      </View>
    );
  }

  const { sorted, questionInsights, hardest, easiest, avgTimeAll, avgScore, overallCorrectPct } = computed;

  const date    = new Date(session.createdAt);
  const dateStr = date.toLocaleDateString('he-IL', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={s.container}>
      {/* ── ראש ── */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}> חזרה</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.kicker}>דוח משחק · {dateStr} · {timeStr}</Text>
          <Text style={s.title} numberOfLines={2}>{session.quizTitle}</Text>
        </View>
      </View>

      {/* ── chips מידע ── */}
      <View style={s.metaChips}>
        <MetaChip label={`${session.players.length} שחקנים`} />
        <MetaChip label={`${session.questions.length} שאלות`} />
        <MetaChip label={`${overallCorrectPct}% נכונות`} />
      </View>

      {/* ── טאבים ── */}
      <View style={s.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabBtnActive]}
            onPress={() => {
              setTab(t.key);
              setSelectedPlayer(null);
              setSelectedQuestion(null);
            }}
          >
            <Text style={[s.tabBtnText, tab === t.key && s.tabBtnTextActive]}>
              {t.label}
              {t.key === 'players'   ? ` (${session.players.length})`   : ''}
              {t.key === 'questions' ? ` (${session.questions.length})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ══ טאב סקירה ══ */}
        {tab === 'overview' && (
          <View style={s.panel}>
            {/* פודיום */}
            {sorted.length > 0 && (
              <View style={s.podium}>
                {/* 2nd — שמאל */}
                {sorted[1] ? (
                  <View style={[s.pod, s.pod2]}>
                    <View style={s.podRank}><Text style={s.podRankText}>2</Text></View>
                    <View style={s.podAvatar}><Text style={s.podAvatarText}>{sorted[1].nickname.charAt(0)}</Text></View>
                    <Text style={s.podName} numberOfLines={1}>{sorted[1].nickname}</Text>
                    <Text style={s.podScore}>{sorted[1].score.toLocaleString()}</Text>
                    <View style={[s.podBlock, s.podBlock2]} />
                  </View>
                ) : <View style={{ flex: 1 }} />}

                {/* 1st — מרכז */}
                {sorted[0] && (
                  <View style={[s.pod, s.pod1]}>
                    <Text style={s.podCrown}>👑</Text>
                    <View style={[s.podAvatar, s.podAvatarGold]}><Text style={[s.podAvatarText, { color: colors.ink }]}>{sorted[0].nickname.charAt(0)}</Text></View>
                    <Text style={[s.podName, { fontSize: 16 }]} numberOfLines={1}>{sorted[0].nickname}</Text>
                    <Text style={[s.podScore, { fontSize: 16, color: colors.ink }]}>{sorted[0].score.toLocaleString()}</Text>
                    <View style={[s.podBlock, s.podBlock1]} />
                  </View>
                )}

                {/* 3rd — ימין */}
                {sorted[2] ? (
                  <View style={[s.pod, s.pod3]}>
                    <View style={s.podRank}><Text style={s.podRankText}>3</Text></View>
                    <View style={s.podAvatar}><Text style={s.podAvatarText}>{sorted[2].nickname.charAt(0)}</Text></View>
                    <Text style={s.podName} numberOfLines={1}>{sorted[2].nickname}</Text>
                    <Text style={s.podScore}>{sorted[2].score.toLocaleString()}</Text>
                    <View style={[s.podBlock, s.podBlock3]} />
                  </View>
                ) : <View style={{ flex: 1 }} />}
              </View>
            )}

            {/* KPI cards */}
            <View style={s.kpis}>
              <KpiCard label="ממוצע ניקוד"       value={avgScore.toLocaleString()}                       meta={`${session.players.length} שחקנים`} />
              <KpiCard label="אחוז נכונות"        value={`${overallCorrectPct}%`}                        pctColor={pctColor(overallCorrectPct)} />
              <KpiCard label="זמן ממוצע לתשובה"  value={avgTimeAll !== null ? `${avgTimeAll}s` : '—'}   meta="לכל השאלות" />
              <KpiCard label="ניקוד גבוה ביותר"  value={sorted[0]?.score.toLocaleString() ?? '—'}       meta={sorted[0]?.nickname ?? '—'} />
            </View>

            {/* הכי קשה / קלה */}
            {hardest && easiest && hardest.index !== easiest.index && (
              <View style={s.hlRow}>
                <TouchableOpacity
                  style={[s.hl, s.hlHard]}
                  onPress={() => { setTab('questions'); setSelectedQuestion(hardest.question); }}
                >
                  <Text style={s.hlIcon}>🔴</Text>
                  <Text style={s.hlLabel}>הכי קשה</Text>
                  <Text style={s.hlText} numberOfLines={2}>{hardest.question.text}</Text>
                  <Text style={[s.hlPct, { color: colors.bad }]}>{hardest.correctPct}% ענו נכון</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.hl, s.hlEasy]}
                  onPress={() => { setTab('questions'); setSelectedQuestion(easiest.question); }}
                >
                  <Text style={s.hlIcon}>🟢</Text>
                  <Text style={s.hlLabel}>הכי קלה</Text>
                  <Text style={s.hlText} numberOfLines={2}>{easiest.question.text}</Text>
                  <Text style={[s.hlPct, { color: colors.ok }]}>{easiest.correctPct}% ענו נכון</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* progress per question */}
            <View style={s.progressCard}>
              <Text style={s.panelTitle}>אחוז נכונות לפי שאלה</Text>
              {questionInsights.map((qi) => (
                <TouchableOpacity
                  key={qi.index}
                  style={s.progressRow}
                  onPress={() => { setTab('questions'); setSelectedQuestion(qi.question); }}
                >
                  <Text style={s.progressNum}>{qi.index + 1}</Text>
                  <Text style={s.progressText} numberOfLines={1}>
                    {qi.question.text.length > 50 ? qi.question.text.slice(0, 50) + '…' : qi.question.text}
                  </Text>
                  <View style={s.progressBarWrap}>
                    <View style={s.progressBarBg}>
                      <View style={[s.progressBarFill, { width: `${qi.correctPct}%`, backgroundColor: pctColor(qi.correctPct) }]} />
                    </View>
                  </View>
                  <Text style={[s.progressPct, { color: pctColor(qi.correctPct) }]}>{qi.correctPct}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ══ טאב שחקנים (רשימה) ══ */}
        {tab === 'players' && !selectedPlayer && (
          <View style={s.panel}>
            {sorted.map((player, idx) => {
              const correctCount = player.answers.filter(a => a.isCorrect).length;
              const pct = session.questions.length > 0
                ? Math.round((correctCount / session.questions.length) * 100) : 0;
              const unanswered = session.questions.length - player.answers.length;

              return (
                <TouchableOpacity
                  key={player.nickname}
                  style={s.playerRow}
                  onPress={() => setSelectedPlayer(player)}
                >
                  <View style={[s.rankBadge, idx < 3 && s[`rankBadge${idx+1}`]]}>
                    <Text style={s.rankBadgeText}>{idx + 1}</Text>
                  </View>
                  <View style={s.playerAvatar}>
                    <Text style={s.playerAvatarText}>{player.nickname.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.playerName}>{player.nickname}</Text>
                    <Text style={s.playerMeta}>{correctCount}/{session.questions.length} נכון · {pct}%</Text>
                  </View>
                  <Text style={s.playerScore}>{player.score.toLocaleString()}</Text>
                  <Text style={s.rowArrow}>←</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ══ פרטי שחקן ══ */}
        {tab === 'players' && selectedPlayer && (
          <View style={s.panel}>
            <TouchableOpacity style={s.backInner} onPress={() => setSelectedPlayer(null)}>
              <Text style={s.backInnerText}> כל השחקנים</Text>
            </TouchableOpacity>

            {/* Hero */}
            <View style={s.playerHero}>
              <View style={s.playerHeroLeft}>
                <View style={s.bigAvatar}>
                  <Text style={s.bigAvatarText}>{selectedPlayer.nickname.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={s.playerHeroName}>{selectedPlayer.nickname}</Text>
                  {(() => {
                    const rank = sorted.findIndex(p => p.nickname === selectedPlayer.nickname) + 1;
                    const c    = selectedPlayer.answers.filter(a => a.isCorrect).length;
                    const pct  = Math.round((c / session.questions.length) * 100);
                    return <Text style={s.playerHeroMeta}>דירוג {rank} · {c}/{session.questions.length} נכון · {pct}%</Text>;
                  })()}
                </View>
              </View>
              <View>
                <Text style={s.playerHeroScore}>{selectedPlayer.score.toLocaleString()}</Text>
                <Text style={s.playerHeroScoreLabel}>נקודות</Text>
              </View>
            </View>

            {/* טבלת תשובות */}
            {session.questions.map((q, idx) => {
              const ans = selectedPlayer.answers.find(a => a.questionIndex === idx);
              const qi  = questionInsights[idx];
              return (
                <View key={idx} style={s.answerRow}>
                  <Text style={s.answerNum}>{idx + 1}</Text>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={s.answerQuestion} numberOfLines={2}>{q.text}</Text>
                    {ans ? (
                      <Text style={[s.answerGiven, !ans.isCorrect && s.answerWrong]}>
                        {ans.answered}
                        {!ans.isCorrect && qi.correctAnswerText ? ` ← נכון: ${qi.correctAnswerText}` : ''}
                      </Text>
                    ) : (
                      <Text style={s.answerNoAnswer}>לא ענה</Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    {ans ? (
                      <View style={[s.resultBadge, ans.isCorrect ? s.resultOk : s.resultBad]}>
                        <Text style={[s.resultBadgeText, { color: ans.isCorrect ? colors.ok : colors.bad }]}>
                          {ans.isCorrect ? '✓' : '✕'}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={s.answerTime}>{ans ? `${ans.timeToAnswer}s` : '—'}</Text>
                    <Text style={s.answerPts}>{ans ? ans.pointsEarned : 0}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ══ טאב שאלות (רשימה) ══ */}
        {tab === 'questions' && !selectedQuestion && (
          <View style={s.panel}>
            {questionInsights.map((qi) => (
              <TouchableOpacity
                key={qi.index}
                style={s.qRow}
                onPress={() => setSelectedQuestion(qi.question)}
              >
                <Text style={s.qRowNum}>{qi.index + 1}</Text>
                <Text style={s.qRowText} numberOfLines={2}>
                  {qi.question.text.length > 60 ? qi.question.text.slice(0, 60) + '…' : qi.question.text}
                </Text>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[s.qRowPct, { color: pctColor(qi.correctPct) }]}>{qi.correctPct}%</Text>
                  <Text style={s.qRowTime}>{qi.avgTime !== null ? `${qi.avgTime}s` : '—'}</Text>
                </View>
                <Text style={s.rowArrow}>←</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ══ פרטי שאלה ══ */}
        {tab === 'questions' && selectedQuestion && (() => {
          const qIdx = session.questions.indexOf(selectedQuestion);
          const qi   = questionInsights[qIdx];
          const distEntries = Object.entries(qi.counts).sort((a, b) => b[1] - a[1]);
          const maxCount    = Math.max(...Object.values(qi.counts), 1);
          const totalAns    = selectedQuestion.totalAnswered;

          return (
            <View style={s.panel}>
              <TouchableOpacity style={s.backInner} onPress={() => setSelectedQuestion(null)}>
                <Text style={s.backInnerText}> כל השאלות</Text>
              </TouchableOpacity>

              {/* Hero שאלה */}
              <View style={s.qHero}>
                <Text style={s.qHeroNum}>שאלה {qIdx + 1}</Text>
                <Text style={s.qHeroText}>{selectedQuestion.text}</Text>
                <View style={s.qStats}>
                  {[
                    { label: 'ענו',    value: selectedQuestion.totalAnswered },
                    { label: 'נכון',   value: selectedQuestion.totalCorrect, color: colors.ok },
                    { label: 'שגוי',   value: selectedQuestion.totalAnswered - selectedQuestion.totalCorrect, color: colors.bad },
                    { label: 'נכונות', value: `${qi.correctPct}%` },
                    { label: 'זמן ממוצע', value: qi.avgTime !== null ? `${qi.avgTime}s` : '—' },
                  ].map((item, i) => (
                    <View key={i} style={s.qStatItem}>
                      <Text style={[s.qStatVal, item.color && { color: item.color }]}>{item.value}</Text>
                      <Text style={s.qStatLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* התפלגות תשובות */}
              {distEntries.length > 0 && (
                <View style={s.distCard}>
                  <Text style={s.panelTitle}>איך הצביעו השחקנים</Text>
                  {distEntries.map(([text, count], i) => {
                    const meta      = ANSWER_META[i % ANSWER_META.length];
                    const isCorrect = text === qi.correctAnswerText;
                    const pct2      = totalAns > 0 ? Math.round((count / totalAns) * 100) : 0;
                    const barW      = (count / maxCount) * 100;
                    return (
                      <View key={text} style={[s.distRow, isCorrect && s.distRowCorrect]}>
                        <View style={[s.distTag, { backgroundColor: meta.color }]}>
                          <Text style={[s.distTagText, { color: meta.textOn || '#fff' }]}>{meta.letter}</Text>
                        </View>
                        <View style={{ flex: 1, gap: 6 }}>
                          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Text style={s.distText} numberOfLines={2}>
                              {text}
                              {isCorrect ? '  ✓' : ''}
                            </Text>
                            <Text style={s.distCount}>{count} · {pct2}%</Text>
                          </View>
                          <View style={s.distBarBg}>
                            <View style={[s.distBarFill, { width: `${barW}%`, backgroundColor: meta.color }]} />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* תשובות שחקנים לשאלה */}
              <Text style={s.panelTitle}>תשובה לכל שחקן</Text>
              {session.players.map((player) => {
                const ans = player.answers.find(a => a.questionIndex === qIdx);
                return (
                  <View key={player.nickname} style={s.answerRow}>
                    <View style={s.playerAvatar}>
                      <Text style={s.playerAvatarText}>{player.nickname.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.playerName}>{player.nickname}</Text>
                      {ans ? (
                        <Text style={s.answerGiven}>{ans.answered}</Text>
                      ) : (
                        <Text style={s.answerNoAnswer}>לא ענה</Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      {ans ? (
                        <View style={[s.resultBadge, ans.isCorrect ? s.resultOk : s.resultBad]}>
                          <Text style={[s.resultBadgeText, { color: ans.isCorrect ? colors.ok : colors.bad }]}>
                            {ans.isCorrect ? '✓' : '✕'}
                          </Text>
                        </View>
                      ) : null}
                      <Text style={s.answerTime}>{ans ? `${ans.timeToAnswer}s` : '—'}</Text>
                      <Text style={s.answerPts}>{ans ? ans.pointsEarned : 0}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })()}
      </ScrollView>
    </View>
  );
}

/* ── קומפוננטות עזר ── */
function MetaChip({ label }) {
  return (
    <View style={s.metaChip}>
      <Text style={s.metaChipText}>{label}</Text>
    </View>
  );
}

function KpiCard({ label, value, meta, pctColor: pc }) {
  return (
    <View style={s.kpiCard}>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={[s.kpiValue, pc && { color: pc }]}>{value}</Text>
      {meta ? <Text style={s.kpiMeta}>{meta}</Text> : null}
    </View>
  );
}

function pctColor(pct) {
  if (pct >= 70) return colors.ok;
  if (pct >= 40) return colors.warn;
  return colors.bad;
}

/* ── Styles ── */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  centered: { alignItems: 'center', justifyContent: 'center' },
  notFound: { fontFamily: fonts.body, fontSize: 16, color: colors.ink3 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },

  topBar: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12,
    backgroundColor: colors.cream,
    borderBottomWidth: 1, borderBottomColor: 'rgba(20,18,26,0.06)',
  },
  backBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.pill,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.12)', flexShrink: 0,
  },
  backBtnText: { fontFamily: fonts.body, fontWeight: '600', fontSize: 13, color: colors.ink3 },
  kicker: { fontFamily: fonts.num, fontSize: 11, fontWeight: '600', color: colors.inkMute, textAlign: 'right', marginBottom: 4 },
  title: { fontFamily: fonts.display, fontWeight: '800', fontSize: 22, letterSpacing: -0.4, color: colors.ink, textAlign: 'right' },

  metaChips: { flexDirection: 'row-reverse', gap: 8, flexWrap: 'wrap', paddingHorizontal: 16, paddingVertical: 10 },
  metaChip: {
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: colors.paper, borderWidth: 1,
    borderColor: 'rgba(20,18,26,0.08)', borderRadius: radii.pill,
  },
  metaChipText: { fontFamily: fonts.num, fontSize: 12, fontWeight: '600', color: colors.ink3 },

  tabBar: {
    flexDirection: 'row-reverse', borderBottomWidth: 2,
    borderBottomColor: 'rgba(20,18,26,0.08)', marginHorizontal: 16,
  },
  tabBtn: { paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -2 },
  tabBtnActive: { borderBottomColor: colors.ink },
  tabBtnText: { fontFamily: fonts.display, fontWeight: '700', fontSize: 14, color: colors.ink3 },
  tabBtnTextActive: { color: colors.ink },

  panel: { gap: 14, paddingTop: 16 },

  // ── Podium ──
  podium: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 10,
    backgroundColor: colors.paper, borderRadius: radii.xl,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    padding: 16, paddingTop: 24,
  },
  pod: { flex: 1, alignItems: 'center', gap: 6 },
  pod1: {}, pod2: {}, pod3: {},
  podCrown: { fontSize: 24, lineHeight: 26 },
  podRank: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  podRankText: { fontFamily: fonts.num, fontWeight: '700', fontSize: 11, color: colors.ink },
  podAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center',
  },
  podAvatarGold: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.ans3 },
  podAvatarText: { fontFamily: fonts.display, fontWeight: '800', fontSize: 20, color: colors.ans3 },
  podName: { fontFamily: fonts.display, fontWeight: '700', fontSize: 13, color: colors.ink, textAlign: 'center', maxWidth: 80 },
  podScore: { fontFamily: fonts.num, fontWeight: '700', fontSize: 13, color: colors.ink3, marginBottom: 6 },
  podBlock: { width: '100%', borderRadius: '10px 10px 0 0', marginTop: 4 },
  podBlock1: { height: 80, backgroundColor: colors.ans3 },
  podBlock2: { height: 62, backgroundColor: colors.ans2 },
  podBlock3: { height: 48, backgroundColor: colors.ans1 },

  // ── KPIs ──
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: colors.paper, borderRadius: radii.lg,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    padding: 16, gap: 4,
  },
  kpiLabel: { fontFamily: fonts.num, fontSize: 11, fontWeight: '600', letterSpacing: 0.06, textTransform: 'uppercase', color: colors.inkMute },
  kpiValue: { fontFamily: fonts.display, fontWeight: '800', fontSize: 24, letterSpacing: -0.4, color: colors.ink },
  kpiMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.ink3 },

  // ── Highlight hard/easy ──
  hlRow: { flexDirection: 'row', gap: 10 },
  hl: {
    flex: 1, padding: 16, borderRadius: radii.lg,
    borderWidth: 1, gap: 6,
  },
  hlHard: { borderColor: 'rgba(214,58,45,0.25)', backgroundColor: 'rgba(214,58,45,0.04)' },
  hlEasy: { borderColor: 'rgba(30,158,95,0.25)',  backgroundColor: 'rgba(30,158,95,0.04)'  },
  hlIcon:  { fontSize: 14 },
  hlLabel: { fontFamily: fonts.num, fontSize: 11, fontWeight: '700', letterSpacing: 0.08, textTransform: 'uppercase', color: colors.inkMute },
  hlText:  { fontFamily: fonts.display, fontWeight: '600', fontSize: 14, color: colors.ink, textAlign: 'right' },
  hlPct:   { fontFamily: fonts.num, fontWeight: '700', fontSize: 13 },

  // ── Progress ──
  progressCard: {
    backgroundColor: colors.paper, borderRadius: radii.lg,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)', padding: 18,
  },
  panelTitle: { fontFamily: fonts.display, fontWeight: '700', fontSize: 16, color: colors.ink, textAlign: 'right', marginBottom: 14 },
  progressRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(20,18,26,0.05)',
  },
  progressNum:  { fontFamily: fonts.num, fontWeight: '700', fontSize: 13, color: colors.inkMute, width: 24, textAlign: 'center' },
  progressText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  progressBarWrap: { width: 80 },
  progressBarBg:   { height: 7, backgroundColor: 'rgba(20,18,26,0.06)', borderRadius: 999, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 999 },
  progressPct: { fontFamily: fonts.num, fontWeight: '700', fontSize: 13, width: 40, textAlign: 'left' },

  // ── Player rows ──
  playerRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    backgroundColor: colors.paper, borderRadius: radii.lg,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)', padding: 14,
  },
  rankBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.cream, borderWidth: 1, borderColor: 'rgba(20,18,26,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  rankBadge1: { backgroundColor: colors.ans3, borderColor: 'rgba(107,132,19,0.3)' },
  rankBadge2: { backgroundColor: colors.ans2, borderColor: 'rgba(44,31,184,0.3)' },
  rankBadge3: { backgroundColor: colors.ans1, borderColor: 'rgba(178,58,31,0.3)' },
  rankBadgeText: { fontFamily: fonts.num, fontWeight: '700', fontSize: 12, color: colors.ink },
  playerAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center',
  },
  playerAvatarText: { fontFamily: fonts.display, fontWeight: '800', fontSize: 15, color: colors.ans3 },
  playerName: { fontFamily: fonts.display, fontWeight: '600', fontSize: 15, color: colors.ink, textAlign: 'right' },
  playerMeta: { fontFamily: fonts.num, fontSize: 11, color: colors.inkMute, textAlign: 'right' },
  playerScore: { fontFamily: fonts.num, fontWeight: '700', fontSize: 16, color: colors.ink },
  rowArrow: { color: colors.inkMute, fontSize: 16 },

  // ── Player hero ──
  playerHero: {
    backgroundColor: colors.ink, borderRadius: radii.xl, padding: 24,
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
  },
  playerHeroLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 16 },
  bigAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.ans3, alignItems: 'center', justifyContent: 'center',
  },
  bigAvatarText: { fontFamily: fonts.display, fontWeight: '900', fontSize: 24, color: colors.ink },
  playerHeroName: { fontFamily: fonts.display, fontWeight: '800', fontSize: 22, color: colors.paper, textAlign: 'right' },
  playerHeroMeta: { fontFamily: fonts.body, fontSize: 13, color: 'rgba(251,248,241,0.75)', textAlign: 'right', marginTop: 4 },
  playerHeroScore: { fontFamily: fonts.num, fontWeight: '800', fontSize: 36, color: colors.ans3, lineHeight: 38 },
  playerHeroScoreLabel: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(251,248,241,0.65)', textAlign: 'right' },

  // ── Answer rows ──
  answerRow: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12,
    backgroundColor: colors.paper, borderRadius: radii.md,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    padding: 14,
  },
  answerNum: { fontFamily: fonts.num, fontWeight: '700', fontSize: 13, color: colors.inkMute, width: 22, textAlign: 'center', marginTop: 2 },
  answerQuestion: { fontFamily: fonts.body, fontWeight: '600', fontSize: 13, color: colors.ink, textAlign: 'right' },
  answerGiven: { fontFamily: fonts.body, fontSize: 12, color: colors.ink3, textAlign: 'right' },
  answerWrong: { color: colors.bad, textDecorationLine: 'line-through' },
  answerNoAnswer: { fontFamily: fonts.body, fontSize: 12, color: colors.inkMute, fontStyle: 'italic' },
  answerTime: { fontFamily: fonts.num, fontSize: 11, color: colors.inkMute },
  answerPts:  { fontFamily: fonts.num, fontWeight: '700', fontSize: 13, color: colors.ink },
  resultBadge: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: radii.pill,
  },
  resultOk:  { backgroundColor: 'rgba(30,158,95,0.1)'  },
  resultBad: { backgroundColor: 'rgba(214,58,45,0.1)'  },
  resultBadgeText: { fontFamily: fonts.num, fontWeight: '700', fontSize: 12 },

  // ── Q rows ──
  qRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    backgroundColor: colors.paper, borderRadius: radii.lg,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)', padding: 14,
  },
  qRowNum: { fontFamily: fonts.num, fontWeight: '700', fontSize: 13, color: colors.inkMute, width: 22, textAlign: 'center' },
  qRowText: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink, textAlign: 'right' },
  qRowPct: { fontFamily: fonts.num, fontWeight: '700', fontSize: 14 },
  qRowTime: { fontFamily: fonts.num, fontSize: 11, color: colors.inkMute },

  // ── Q hero ──
  qHero: {
    backgroundColor: colors.paper, borderRadius: radii.xl,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)', padding: 22, gap: 14,
  },
  qHeroNum: { fontFamily: fonts.num, fontSize: 12, fontWeight: '700', letterSpacing: 0.08, textTransform: 'uppercase', color: colors.inkMute },
  qHeroText: { fontFamily: fonts.display, fontWeight: '700', fontSize: 20, color: colors.ink, textAlign: 'right', letterSpacing: -0.3 },
  qStats: { flexDirection: 'row-reverse', backgroundColor: colors.cream, borderRadius: radii.md, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(20,18,26,0.07)' },
  qStatItem: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 12, borderRightWidth: 1, borderRightColor: 'rgba(20,18,26,0.07)' },
  qStatVal: { fontFamily: fonts.display, fontWeight: '800', fontSize: 18, color: colors.ink, lineHeight: 20 },
  qStatLabel: { fontFamily: fonts.num, fontSize: 10, fontWeight: '500', color: colors.inkMute, textTransform: 'uppercase' },

  // ── Distribution ──
  distCard: {
    backgroundColor: colors.paper, borderRadius: radii.lg,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)', padding: 18, gap: 10,
  },
  distRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    padding: 12, backgroundColor: colors.cream,
    borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(20,18,26,0.05)',
  },
  distRowCorrect: { borderColor: colors.ok, backgroundColor: 'rgba(30,158,95,0.06)' },
  distTag: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  distTagText: { fontFamily: fonts.display, fontWeight: '800', fontSize: 18 },
  distText: { fontFamily: fonts.display, fontWeight: '700', fontSize: 14, color: colors.ink, flex: 1, textAlign: 'right' },
  distCount: { fontFamily: fonts.num, fontWeight: '700', fontSize: 16, color: colors.ink, flexShrink: 0 },
  distBarBg: { height: 6, backgroundColor: 'rgba(20,18,26,0.05)', borderRadius: 999, overflow: 'hidden' },
  distBarFill: { height: '100%', borderRadius: 999 },

  // ── Back inner ──
  backInner: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.pill,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.12)',
    alignSelf: 'flex-start',
  },
  backInnerText: { fontFamily: fonts.body, fontWeight: '600', fontSize: 13, color: colors.ink3 },
});