import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { SERVER_URL } from '../../utils/socket';
import { colors, fonts, radii } from '../../constants/theme';

export default function Statistics() {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  const { token } = useAuth();
  const router    = useRouter();

  useFocusEffect(useCallback(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${SERVER_URL}/stats/my-sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSessions(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token]));

  // ── מספר הפעלה לכל חידון + מיון קבוע מהחדש לישן ──
  const sessionsWithRun = useMemo(() => {
    const runCountMap = {};
    return [...sessions]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((s) => {
        runCountMap[s.quizId] = (runCountMap[s.quizId] || 0) + 1;
        return { ...s, runNumber: runCountMap[s.quizId] };
      });
  }, [sessions]);

  const visible = useMemo(() => {
    let list = sessionsWithRun;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s => s.quizTitle.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [sessionsWithRun, search]);

  const totalPlayers = sessions.reduce((s, g) => s + g.players.length, 0);
  const uniqueQuizzes = useMemo(() => new Set(sessions.map(s => s.quizId)).size, [sessions]);

  if (loading) {
    return (
      <View style={[s.container, s.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loaderText}>טוען סטטיסטיקות…</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── כותרת ── */}
        <View style={s.head}>
          <Text style={s.title}>המשחקים שלי</Text>
        </View>

        {/* ── סיכום ── */}
        {sessions.length > 0 && (
          <View style={s.summary}>
            <SumItem value={sessions.length}  label="משחקים" />
            <SumItem value={totalPlayers}      label='שחקנים סה"כ' />
            <SumItem value={uniqueQuizzes}     label="חידונים שונים" last />
          </View>
        )}

        {sessions.length === 0 ? (
          /* ── Empty ── */
          <View style={s.empty}>
            <Text style={s.emptyTitle}>אין הפעלות עדיין</Text>
            <Text style={s.emptySub}>הפעל חידון וסטטיסטיקות המשחק יופיעו כאן</Text>
            <TouchableOpacity
              style={s.emptyBtn}
              onPress={() => router.push('/main/my-quizzes')}
            >
              <Text style={s.emptyBtnText}>לחידונים שלי</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── חיפוש ── */}
            <View style={s.searchWrap}>
              <Text style={s.searchIcon}>⌕</Text>
              <TextInput
                style={s.searchInput}
                placeholderTextColor={colors.inkMute}
                textAlign="right"
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')} style={s.searchClear}>
                  <Text style={s.searchClearText}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* ── רשימה ── */}
            {visible.length === 0 ? (
              <View style={s.noResults}>
                <Text style={s.noResultsText}>לא נמצאו תוצאות</Text>
                <TouchableOpacity onPress={() => setSearch('')} style={s.noResultsBtn}>
                  <Text style={s.noResultsBtnText}>נקה חיפוש</Text>
                </TouchableOpacity>
              </View>
            ) : (
              visible.map((session) => {
                const date     = new Date(session.createdAt);
                const dateStr  = date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const timeStr  = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
                const avgScore = session.players.length > 0
                  ? Math.round(session.players.reduce((s, p) => s + p.score, 0) / session.players.length)
                  : 0;
                const totalCorrect = session.questions.reduce((s, q) => s + q.totalCorrect, 0);
                const totalAns     = session.questions.reduce((s, q) => s + q.totalAnswered, 0);
                const correctPct   = totalAns > 0 ? Math.round((totalCorrect / totalAns) * 100) : 0;
                const pctColor     = correctPct >= 70 ? colors.ok : correctPct >= 40 ? colors.warn : colors.bad;

                return (
                  <TouchableOpacity
                    key={session._id}
                    style={s.row}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/main/session?id=${session._id}`)}
                  >
                    <View style={s.rowMain}>
                      <View>
                        <Text style={s.rowRun}>הפעלה #{session.runNumber}</Text>
                        <Text style={s.rowTitle}>{session.quizTitle}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.rowDate}>{dateStr}</Text>
                        <Text style={s.rowTime}>{timeStr}</Text>
                      </View>
                    </View>

                    <View style={s.chips}>
                      <Chip label={`${session.players.length} שחקנים`} />
                      <Chip label={`${session.questions.length} שאלות`} />
                      <Chip label={`ממוצע ${avgScore.toLocaleString()} נק'`} />
                      <Chip
                        label={`${correctPct}% נכונות`}
                        color={pctColor}
                        bg={`${pctColor}18`}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SumItem({ value, label, last }) {
  return (
    <View style={[s.sumItem, !last && s.sumItemBorder]}>
      <Text style={s.sumVal}>{value}</Text>
      <Text style={s.sumLabel}>{label}</Text>
    </View>
  );
}

function Chip({ icon, label, color, bg }) {
  return (
    <View style={[s.chip, bg && { backgroundColor: bg, borderColor: color + '40' }]}>
      {icon ? <Text style={s.chipIcon}>{icon}</Text> : null}
      <Text style={[s.chipText, color && { color, fontWeight: '700' }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  centered:  { alignItems: 'center', justifyContent: 'center' },
  scroll:    { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },

  loaderText: {
    fontFamily: fonts.num, fontSize: 12, fontWeight: '500',
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.inkMute, marginTop: 16,
  },

  // ── כותרת ──
  head:  { marginBottom: 20 },
  kicker: {
    fontFamily: fonts.num, fontSize: 11, fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.inkMute, marginBottom: 6, textAlign: 'right',
  },
  title: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 36, letterSpacing: -0.9, color: colors.ink, textAlign: 'right',
  },

  // ── סיכום ──
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    borderRadius: radii.lg, overflow: 'hidden', marginBottom: 20,
  },
  sumItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  sumItemBorder: { borderRightWidth: 1, borderRightColor: 'rgba(20,18,26,0.08)' },
  sumVal: {
    fontFamily: fonts.display, fontWeight: '800', fontSize: 24,
    color: colors.ink, lineHeight: 26,
  },
  sumLabel: {
    fontFamily: fonts.num, fontSize: 10, fontWeight: '500',
    color: colors.inkMute, textTransform: 'uppercase', marginTop: 2,
  },

  // ── Empty ──
  empty: { marginTop: 40, alignItems: 'center', gap: 12 },
  emptyTitle: {
    fontFamily: fonts.display, fontWeight: '800', fontSize: 24,
    letterSpacing: -0.4, color: colors.ink,
  },
  emptySub: {
    fontFamily: fonts.body, fontSize: 14, color: colors.ink3,
    textAlign: 'center', maxWidth: 280,
  },
  emptyBtn: {
    marginTop: 8, paddingVertical: 12, paddingHorizontal: 24,
    backgroundColor: colors.primary, borderRadius: radii.pill,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  emptyBtnText: { fontFamily: fonts.display, fontWeight: '700', fontSize: 15, color: '#fff' },

  // ── חיפוש ──
  searchWrap: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.08)',
    borderRadius: radii.md, paddingHorizontal: 14, marginBottom: 16,
  },
  searchIcon: { fontSize: 16, color: colors.inkMute, marginLeft: 8 },
  searchInput: {
    flex: 1, paddingVertical: 12,
    fontFamily: fonts.body, fontSize: 14, color: colors.ink,
  },
  searchClear: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(20,18,26,0.1)',
    alignItems: 'center', justifyContent: 'center', marginRight: 4,
  },
  searchClearText: { color: colors.ink3, fontWeight: '700', fontSize: 11 },

  // ── No results ──
  noResults: {
    backgroundColor: colors.paper, borderWidth: 1,
    borderColor: 'rgba(20,18,26,0.08)', borderStyle: 'dashed',
    borderRadius: radii.lg, padding: 28, alignItems: 'center', gap: 12,
  },
  noResultsText: { fontFamily: fonts.body, fontSize: 15, color: colors.ink3 },
  noResultsBtn: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: radii.pill, borderWidth: 1, borderColor: 'rgba(20,18,26,0.18)',
  },
  noResultsBtnText: { fontFamily: fonts.body, fontWeight: '600', fontSize: 13, color: colors.ink },

  // ── Row ──
  row: {
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    borderRadius: radii.lg, padding: 18, marginBottom: 12, gap: 12,
  },
  rowMain: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowRun: {
    fontFamily: fonts.num, fontSize: 11, fontWeight: '700',
    letterSpacing: 0.08, textTransform: 'uppercase', color: colors.primary,
  },
  rowTitle: {
    fontFamily: fonts.display, fontWeight: '700',
    fontSize: 18, color: colors.ink, textAlign: 'right', marginTop: 2,
  },
  rowDate: { fontFamily: fonts.num, fontSize: 12, fontWeight: '600', color: colors.ink3 },
  rowTime: { fontFamily: fonts.num, fontSize: 11, fontWeight: '500', color: colors.inkMute },

  // ── Chips ──
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: colors.cream,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.07)',
    borderRadius: radii.pill,
  },
  chipIcon: { fontSize: 11 },
  chipText: { fontFamily: fonts.num, fontSize: 11, fontWeight: '600', color: colors.ink3 },
});