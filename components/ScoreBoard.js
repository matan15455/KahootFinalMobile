import { View, Text, StyleSheet, FlatList } from 'react-native';

export default function ScoreBoard({ players = [] }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const medals = ['👑', '🥈', '🥉'];
  const podiumColors = [
    'rgba(251,191,36,0.25)',
    'rgba(156,163,175,0.2)',
    'rgba(180,83,9,0.2)',
  ];
  const podiumBorders = [
    'rgba(251,191,36,0.5)',
    'rgba(156,163,175,0.35)',
    'rgba(180,83,9,0.4)',
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 ניקוד</Text>

      {/* Podium */}
      <View style={styles.podium}>
        {/* מקום שני - שמאל */}
        {top3[1] && (
          <View style={[styles.podiumCard, styles.podiumSecond,
            { backgroundColor: podiumColors[1], borderColor: podiumBorders[1] }]}>
            <Text style={styles.podiumMedal}>{medals[1]}</Text>
            <Text style={styles.podiumName} numberOfLines={1}>{top3[1].nickname}</Text>
            <Text style={styles.podiumScore}>{top3[1].score}</Text>
          </View>
        )}

        {/* מקום ראשון - מרכז */}
        {top3[0] && (
          <View style={[styles.podiumCard, styles.podiumFirst,
            { backgroundColor: podiumColors[0], borderColor: podiumBorders[0] }]}>
            <Text style={styles.podiumMedal}>{medals[0]}</Text>
            <Text style={styles.podiumName} numberOfLines={1}>{top3[0].nickname}</Text>
            <Text style={styles.podiumScore}>{top3[0].score}</Text>
          </View>
        )}

        {/* מקום שלישי - ימין */}
        {top3[2] && (
          <View style={[styles.podiumCard, styles.podiumThird,
            { backgroundColor: podiumColors[2], borderColor: podiumBorders[2] }]}>
            <Text style={styles.podiumMedal}>{medals[2]}</Text>
            <Text style={styles.podiumName} numberOfLines={1}>{top3[2].nickname}</Text>
            <Text style={styles.podiumScore}>{top3[2].score}</Text>
          </View>
        )}
      </View>

      {/* שאר השחקנים */}
      {rest.length > 0 && (
        <FlatList
          data={rest}
          keyExtractor={(p, i) => p.userId || String(i)}
          scrollEnabled={false}
          contentContainerStyle={styles.restList}
          renderItem={({ item, index }) => (
            <View style={styles.restItem}>
              <Text style={styles.restRank}>#{index + 4}</Text>
              <Text style={styles.restName} numberOfLines={1}>{item.nickname}</Text>
              <Text style={styles.restScore}>{item.score}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 4,
  },
  title: {
    color: '#eaf0ff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
  },

  // Podium
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  podiumCard: {
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    padding: 14,
    flex: 1,
  },
  podiumFirst: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  podiumSecond: {
    paddingTop: 10,
    paddingBottom: 14,
  },
  podiumThird: {
    paddingTop: 10,
    paddingBottom: 14,
  },
  podiumMedal: {
    fontSize: 28,
    marginBottom: 8,
  },
  podiumName: {
    color: '#eaf0ff',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  podiumScore: {
    color: '#22d3ee',
    fontSize: 18,
    fontWeight: '900',
  },

  // Rest
  restList: { gap: 8, width: '100%' },
  restItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  restRank: {
    color: 'rgba(234,240,255,0.4)',
    fontSize: 14,
    fontWeight: '700',
    width: 30,
  },
  restName: {
    flex: 1,
    color: '#eaf0ff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
  restScore: {
    color: '#22d3ee',
    fontSize: 16,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'right',
  },
});