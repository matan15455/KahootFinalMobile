import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getSocket } from '../../utils/socket';
import * as Clipboard from 'expo-clipboard';

export default function CreateRoom() {
  const [room, setRoom] = useState(null);
  const [starting, setStarting] = useState(false);

  const router = useRouter();
  const { quizId, title } = useLocalSearchParams();
  const roomCreated = useRef(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // listener קודם לפני emit
    const handleRoomUpdated = (roomData) => {
      setRoom(roomData);
      if (roomData.phase === 'QUESTION') {
        router.replace(`/game/host/game?roomId=${roomData.roomId}`);
      }
    };

    socket.on('roomUpdated', handleRoomUpdated);

    // emit רק פעם אחת
    if (!roomCreated.current) {
      roomCreated.current = true;
      socket.emit('createRoom', { quizId });
    }

    return () => socket.off('roomUpdated', handleRoomUpdated);
  }, []);

  const handleStart = () => {
    const socket = getSocket();
    if (!room || !socket) return;
    if (room.players.length === 0) {
      Alert.alert('שגיאה', 'לא ניתן להתחיל ללא שחקנים');
      return;
    }
    setStarting(true);
    socket.emit('startQuiz', { roomId: room.roomId });
  };

  const handleCopy = async () => {
    if (!room) return;
    await Clipboard.setStringAsync(room.roomId);
    Alert.alert('הועתק!', `קוד החדר ${room.roomId} הועתק ללוח`);
  };

  if (!room) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#22d3ee" />
          <Text style={styles.loadingText}>יוצר חדר…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#eaf0ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || 'חדר משחק'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>קוד הצטרפות</Text>
        <TouchableOpacity style={styles.codeRow} onPress={handleCopy} activeOpacity={0.7}>
          <Ionicons name="copy-outline" size={20} color="rgba(234,240,255,0.5)" />
          <Text style={styles.codeText}>{room.roomId}</Text>
        </TouchableOpacity>
        <Text style={styles.codeHint}>לחץ להעתקה</Text>
      </View>

      <View style={styles.playersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>שחקנים</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{room.players.length}</Text>
          </View>
        </View>

        {room.players.length === 0 ? (
          <View style={styles.emptyPlayers}>
            <Ionicons name="people-outline" size={40} color="rgba(234,240,255,0.2)" />
            <Text style={styles.emptyText}>ממתין לשחקנים…</Text>
          </View>
        ) : (
          <FlatList
            data={room.players}
            keyExtractor={(p) => p.socketId || p.userId}
            contentContainerStyle={styles.playersList}
            renderItem={({ item, index }) => (
              <View style={styles.playerItem}>
                <View style={[styles.playerIndex, { backgroundColor: indexColor(index) }]}>
                  <Text style={styles.playerIndexText}>{index + 1}</Text>
                </View>
                <Text style={styles.playerName}>{item.nickname}</Text>
                <Ionicons name="checkmark-circle" size={18} color="#34d399" />
              </View>
            )}
          />
        )}
      </View>

      <View style={styles.footer}>
        {room.players.length === 0 && (
          <Text style={styles.noPlayersWarning}>❌ לא ניתן להתחיל ללא שחקנים</Text>
        )}
        <TouchableOpacity
          style={[styles.startBtn, (room.players.length === 0 || starting) && styles.startBtnDisabled]}
          onPress={handleStart}
          disabled={room.players.length === 0 || starting}
          activeOpacity={0.8}
        >
          {starting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.startBtnRow}>
              <Ionicons name="play-circle-outline" size={24} color="#eaf0ff" />
              <Text style={styles.startBtnText}>התחל משחק</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function indexColor(i) {
  const colors = [
    'rgba(124,58,237,0.4)', 'rgba(34,211,238,0.35)',
    'rgba(249,115,22,0.35)', 'rgba(52,211,153,0.35)',
  ];
  return colors[i % colors.length];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070815' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: 'rgba(234,240,255,0.6)', fontSize: 16 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20,
  },
  headerTitle: { color: '#eaf0ff', fontSize: 18, fontWeight: '800', maxWidth: 200 },
  codeCard: {
    marginHorizontal: 24, marginBottom: 24,
    backgroundColor: 'rgba(34,211,238,0.08)', borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(34,211,238,0.22)',
    padding: 24, alignItems: 'center',
  },
  codeLabel: { color: 'rgba(234,240,255,0.55)', fontSize: 13, letterSpacing: 1, marginBottom: 10 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  codeText: { color: '#22d3ee', fontSize: 36, fontWeight: '900', letterSpacing: 6 },
  codeHint: { color: 'rgba(234,240,255,0.3)', fontSize: 11, marginTop: 6 },
  playersSection: { flex: 1, paddingHorizontal: 24 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end', gap: 10, marginBottom: 14,
  },
  sectionTitle: { color: '#eaf0ff', fontSize: 18, fontWeight: '800' },
  countBadge: {
    minWidth: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(34,211,238,0.2)', borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.35)', justifyContent: 'center',
    alignItems: 'center', paddingHorizontal: 6,
  },
  countText: { color: '#22d3ee', fontSize: 13, fontWeight: '800' },
  emptyPlayers: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, opacity: 0.6 },
  emptyText: { color: 'rgba(234,240,255,0.4)', fontSize: 15 },
  playersList: { gap: 10 },
  playerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  playerIndex: { width: 32, height: 32, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  playerIndexText: { color: '#eaf0ff', fontSize: 13, fontWeight: '800' },
  playerName: { flex: 1, color: '#eaf0ff', fontSize: 15, fontWeight: '700', textAlign: 'right' },
  footer: { padding: 24, paddingBottom: 40, gap: 12 },
  noPlayersWarning: { color: '#fb7185', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  startBtn: {
    backgroundColor: 'rgba(34,211,238,0.22)', borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.4)', borderRadius: 20, padding: 18, alignItems: 'center',
  },
  startBtnDisabled: { opacity: 0.45 },
  startBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  startBtnText: { color: '#eaf0ff', fontSize: 18, fontWeight: '900' },
});