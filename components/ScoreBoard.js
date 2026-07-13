
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors, fonts, radii } from '../constants/theme';
import { EpShape } from './EpBrand';

const PODIUM = [
  { medal: '👑', shape: 'burst', bg: '#FFF0CC', border: 'rgba(229,156,0,0.35)', height: 100, textColor: '#7A5600' },
  { medal: '🥈', shape: 'hex',   bg: '#F0F0F0', border: 'rgba(140,140,140,0.3)', height: 80,  textColor: '#555'    },
  { medal: '🥉', shape: 'wave',  bg: '#FFE8DC', border: 'rgba(180,83,9,0.3)',    height: 68,  textColor: '#7A3A0A' },
];

export default function ScoreBoard({ players = [] }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const top3   = sorted.slice(0, 3);
  const rest   = sorted.slice(3);

  return (
    <View style={s.container}>
      <Text style={s.title}>לוח תוצאות</Text>

      {/* ── Podium ── */}
      {top3.length > 0 && (
        <View style={s.podium}>
          {/* 2nd — left */}
          {top3[1] ? (
            <PodiumCard player={top3[1]} rank={1} />
          ) : <View style={{ flex: 1 }} />}

          {/* 1st — center (taller) */}
          {top3[0] && <PodiumCard player={top3[0]} rank={0} center />}

          {/* 3rd — right */}
          {top3[2] ? (
            <PodiumCard player={top3[2]} rank={2} />
          ) : <View style={{ flex: 1 }} />}
        </View>
      )}

      {/* ── Rest ── */}
      {rest.length > 0 && (
        <View style={s.restWrap}>
          {rest.map((p, i) => (
            <View key={p.userId || i} style={s.restRow}>
              <Text style={s.restRank}>#{i + 4}</Text>
              <Text style={s.restName} numberOfLines={1}>{p.nickname}</Text>
              <View style={s.restScoreBadge}>
                <Text style={s.restScore}>{p.score}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function PodiumCard({ player, rank, center }) {
  const meta = PODIUM[rank];
  return (
    <View style={[s.podiumCard, center && s.podiumCenter, { backgroundColor: meta.bg, borderColor: meta.border }]}>
      {/* צורה דקורטיבית ברקע */}
      <View style={s.podiumBgShape}>
        <EpShape kind={meta.shape} color={meta.border} size={center ? 90 : 70} />
      </View>

      <Text style={s.podiumMedal}>{meta.medal}</Text>
      <Text style={[s.podiumName, { color: meta.textColor }]} numberOfLines={1}>
        {player.nickname}
      </Text>
      <Text style={[s.podiumScore, { color: meta.textColor }]}>
        {player.score}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { width: '100%' },

  title: {
    fontFamily: fonts.display,
    fontWeight: '800',
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 20,
  },

  // ── Podium ──
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 16,
  },
  podiumCard: {
    flex: 1,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    minHeight: 90,
    justifyContent: 'flex-end',
  },
  podiumCenter: {
    minHeight: 116,
    borderRadius: radii.lg,
  },
  podiumBgShape: {
    position: 'absolute',
    bottom: -16,
    left: -12,
    opacity: 0.25,
  },
  podiumMedal: {
    fontSize: 22,
    marginBottom: 6,
  },
  podiumName: {
    fontFamily: fonts.display,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumScore: {
    fontFamily: fonts.num,
    fontWeight: '700',
    fontSize: 16,
  },

  // ── Rest ──
  restWrap: {
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(20,18,26,0.06)',
    overflow: 'hidden',
  },
  restRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(20,18,26,0.05)',
  },
  restRank: {
    fontFamily: fonts.num,
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkMute,
    width: 28,
    textAlign: 'right',
  },
  restName: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'right',
  },
  restScoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
  },
  restScore: {
    fontFamily: fonts.num,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});