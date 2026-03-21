import { useState, useEffect, useCallback, useRef } from 'react';import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getSocket } from '../../utils/socket';

export default function JoinRoom() {
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joining, setJoining] = useState(false);
  const [room, setRoom] = useState(null);

  const router = useRouter();
  const socket = getSocket();

  const roomRef = useRef(null); // שינוי 3: ref לעקוב אחרי room בלי dependency

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // שינוי 4: החלפת useEffect ל-useFocusEffect שמנקה כשעוזבים את הטאב
  useFocusEffect(
    useCallback(() => {
      const socket = getSocket();
      if (!socket) return;

      const handleRoomUpdated = (roomData) => {
        if (roomRef.current && roomData.roomId !== roomRef.current.roomId) return;
        setRoom(roomData);
        if (roomData.phase === 'QUESTION') {
          router.replace(`/game/player/game?roomId=${roomData.roomId}`);
        }
      };

      socket.on('roomUpdated', handleRoomUpdated);

      return () => {
        // שינוי 5: ניקוי listener + איפוס state כשעוזבים את הטאב
        socket.off('roomUpdated', handleRoomUpdated);
        setRoom(null);
      };
    }, [])
  );

  const handleJoin = () => {
    if (!socket) {
      Alert.alert('שגיאה', 'אין חיבור לשרת');
      return;
    }
    if (!nickname.trim() || !roomId.trim()) {
      Alert.alert('שגיאה', 'אנא מלא שם כינוי וקוד חדר');
      return;
    }

    setJoining(true);

    socket.emit('joinRoom', { roomId: roomId.trim(), nickname: nickname.trim() }, (res) => {
      setJoining(false);
      if (!res.ok) {
        Alert.alert('שגיאה', res.message);
      }
      // on success → roomUpdated will fire and set room
    });
  };

  // ── מסך המתנה לאחר הצטרפות ──────────────────────────
  if (room) {
    return (
      <View style={styles.container}>
        <View style={styles.waitingCard}>
          <View style={styles.waitingHeader}>
            <Text style={styles.waitingTitle}>🎮 {room.roomId}</Text>
            <Text style={styles.waitingSubtitle}>ממתין שהמארח יתחיל…</Text>
          </View>

          <View style={styles.playersMeta}>
            <Ionicons name="people-outline" size={16} color="#22d3ee" />
            <Text style={styles.playersCount}>{room.players.length} שחקנים בחדר</Text>
          </View>

          <FlatList
            data={room.players}
            keyExtractor={(p) => p.socketId || p.userId}
            contentContainerStyle={styles.playersList}
            renderItem={({ item, index }) => (
              <View style={[styles.playerItem, { animationDelay: `${index * 0.06}s` }]}>
                <View style={styles.playerAvatar}>
                  <Text style={styles.playerAvatarText}>
                    {item.nickname.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.playerName}>{item.nickname}</Text>
                {item.nickname === nickname && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>אתה</Text>
                  </View>
                )}
              </View>
            )}
          />

          <View style={styles.pulseDot}>
            <View style={styles.dot} />
            <Text style={styles.pulseText}>מחכים למארח</Text>
          </View>
        </View>
      </View>
    );
  }

  // ── טופס הצטרפות ────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#eaf0ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>הצטרף לחדר</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.formCard}>
        <View style={styles.iconWrap}>
          <Ionicons name="game-controller-outline" size={48} color="#22d3ee" />
        </View>

        <Text style={styles.formTitle}>הכנס פרטים</Text>
        <Text style={styles.formSubtitle}>ציין שם כינוי וקוד חדר כדי להצטרף</Text>

        <TextInput
          style={styles.input}
          placeholder="כינוי"
          placeholderTextColor="rgba(234,240,255,0.4)"
          value={nickname}
          onChangeText={setNickname}
          textAlign="right"
          maxLength={20}
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="קוד חדר"
          placeholderTextColor="rgba(234,240,255,0.4)"
          value={roomId}
          onChangeText={setRoomId}
          textAlign="right"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.joinBtn, joining && styles.btnDisabled]}
          onPress={handleJoin}
          disabled={joining}
        >
          {joining ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.btnRow}>
              <Ionicons name="enter-outline" size={20} color="#eaf0ff" />
              <Text style={styles.joinBtnText}>הצטרף</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070815',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#eaf0ff',
    fontSize: 20,
    fontWeight: '800',
  },
  formCard: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 60,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: 'rgba(34,211,238,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    color: '#eaf0ff',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    color: 'rgba(234,240,255,0.55)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 18,
    padding: 18,
    color: '#eaf0ff',
    fontSize: 16,
    marginBottom: 16,
  },
  joinBtn: {
    backgroundColor: 'rgba(34,211,238,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.35)',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  joinBtnText: {
    color: '#eaf0ff',
    fontSize: 17,
    fontWeight: '800',
  },
  // ── Waiting ──
  waitingCard: {
    flex: 1,
    paddingTop: 70,
    paddingHorizontal: 24,
  },
  waitingHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  waitingTitle: {
    color: '#eaf0ff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: 2,
  },
  waitingSubtitle: {
    color: 'rgba(234,240,255,0.55)',
    fontSize: 14,
  },
  playersMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
    marginBottom: 14,
  },
  playersCount: {
    color: '#22d3ee',
    fontSize: 14,
    fontWeight: '600',
  },
  playersList: {
    gap: 10,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34,211,238,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerAvatarText: {
    color: '#22d3ee',
    fontSize: 18,
    fontWeight: '900',
  },
  playerName: {
    flex: 1,
    color: '#eaf0ff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
  },
  youBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(34,211,238,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.3)',
  },
  youBadgeText: {
    color: '#22d3ee',
    fontSize: 11,
    fontWeight: '700',
  },
  pulseDot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22d3ee',
  },
  pulseText: {
    color: 'rgba(234,240,255,0.5)',
    fontSize: 13,
  },
});