// ===================================================================
// app/main/create-room.js — EduPlay design (Host Lobby)
// תואם ל-CreateRoom.jsx של האתר
// PIN ענק עם lift shadow + 2 כפתורי העתקה + START + Roster כהה
// ===================================================================
import { useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, FlatList,
  ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { getSocket } from '../../utils/socket';
import { colors, fonts, radii } from '../../constants/theme';
import { EpShape } from '../../components/EpBrand';

export default function CreateRoom() {
  const [room, setRoom]         = useState(null);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied]     = useState(null); // 'pin' | 'link' | null

  const router = useRouter();
  const { quizId, title } = useLocalSearchParams();
  const roomCreated = useRef(false);

  useFocusEffect(useCallback(() => {
    const socket = getSocket();
    if (!socket) return;

    setRoom(null);
    setStarting(false);
    roomCreated.current = false;

    const handleRoomUpdated = (data) => {
      setRoom(data);
      if (data.phase === 'QUESTION') {
        router.replace(`/game/host/game?roomId=${data.roomId}`);
      }
    };
    socket.on('roomUpdated', handleRoomUpdated);

    const createOnce = () => {
      if (roomCreated.current) return;
      roomCreated.current = true;
      socket.emit('createRoom', { quizId });
    };
    if (socket.connected) createOnce();
    else socket.once('connect', createOnce);

    return () => { socket.off('roomUpdated', handleRoomUpdated); };
  }, [quizId]));

  const handleStart = () => {
    const socket = getSocket();
    if (!room || !socket) return;
    if (room.players.length === 0) {
      return Alert.alert('שגיאה', 'לא ניתן להתחיל ללא שחקנים');
    }
    setStarting(true);
    socket.emit('startQuiz', { roomId: room.roomId });
  };

  const copyPin = async () => {
    if (!room) return;
    await Clipboard.setStringAsync(room.roomId);
    setCopied('pin');
    setTimeout(() => setCopied(null), 1500);
  };

  // ───────── Loading ─────────
  if (!room) {
    return (
      <View style={[crStyles.container, crStyles.center]}>
        <ActivityIndicator size="large" color={colors.primary}/>
        <Text style={crStyles.loaderText}>יוצר חדר…</Text>
      </View>
    );
  }

  const playerCount = room.players.length;
  const pinDigits = String(room.roomId).split('');

  return (
    <View style={crStyles.container}>
      <ScrollView contentContainerStyle={crStyles.scroll} showsVerticalScrollIndicator={false}>

        {/* ══ Main Card (PIN + CTA) ══ */}
        <View style={crStyles.mainCard}>
          {/* Kicker — pulse dot + "חדר פעיל" */}
          <View style={crStyles.kicker}>
            <View style={crStyles.kickerDot}/>
            <Text style={crStyles.kickerText}>חדר פעיל</Text>
          </View>

          <Text style={crStyles.title}>החדר נוצר</Text>
          <Text style={crStyles.sub}>
           שתף את הקוד המשחק יתחיל כשתלחץ על התחל משחק.
          </Text>

          {/* PIN box */}
          <View style={crStyles.pinWrap}>
            <View style={crStyles.pinRow}>
              {pinDigits.map((d, i) => (
                <View key={i} style={crStyles.pinDigit}>
                  <Text style={crStyles.pinDigitText}>{d}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Copy action */}
          <TouchableOpacity
            style={[crStyles.actBtn, copied === 'pin' && crStyles.actBtnCopied]}
            activeOpacity={0.85}
            onPress={copyPin}
          >
            <Ionicons name="copy-outline" size={18} color={copied === 'pin' ? '#fff' : colors.ink}/>
            <Text style={[crStyles.actBtnText, copied === 'pin' && { color: '#fff' }]}>
              {copied === 'pin' ? '✓ הועתק' : 'העתק קוד'}
            </Text>
          </TouchableOpacity>

          {/* Start CTA — primary */}
          <TouchableOpacity
            style={[
              crStyles.start,
              (playerCount === 0 || starting) && crStyles.startDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleStart}
            disabled={playerCount === 0 || starting}
          >
            {starting ? (
              <ActivityIndicator color="#fff"/>
            ) : (
              <>
                <Text style={crStyles.startIcon}>▶</Text>
                <Text style={crStyles.startText}>התחל משחק</Text>
                {playerCount > 0 && (
                  <Text style={crStyles.startMeta}>· {playerCount} שחקנים</Text>
                )}
              </>
            )}
          </TouchableOpacity>

          {/* Warning hint */}
          {playerCount === 0 && (
            <View style={crStyles.hint}>
              <View style={crStyles.hintIcon}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>!</Text>
              </View>
              <Text style={crStyles.hintText}>
               לא ניתן להתחיל משחק בלי שחקנים חכה שמישהו יצטרף.
              </Text>
            </View>
          )}
        </View>

        {/* ══ Roster Card (dark) ══ */}
        <View style={crStyles.roster}>
          <View style={crStyles.rosterBlob}/>

          <View style={{ position: 'relative' }}>
            <Text style={crStyles.rosterLabel}>שחקנים בחדר</Text>
            <Text style={crStyles.rosterCount}>{playerCount}</Text>
            <View style={crStyles.rosterStatus}>
              <View style={crStyles.pulseDot}/>
              <Text style={crStyles.rosterStatusText}>
ממתין לעוד מצטרפים…
              </Text>
            </View>
          </View>

          {playerCount === 0 ? (
            <View style={crStyles.rosterEmpty}>
              <EpShape kind="hex" size={36} color="rgba(255,255,255,0.18)"/>
              <Text style={crStyles.rosterEmptyText}>
                החדר ריק .{'\n'}שתף את הקוד עם השחקנים.
              </Text>
            </View>
          ) : (
            <FlatList
              data={room.players}
              keyExtractor={(p) => p.socketId || p.userId}
              numColumns={2}
              columnWrapperStyle={{ gap: 8 }}
              ItemSeparatorComponent={() => <View style={{ height: 8 }}/>}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={crStyles.player}>
                  <View style={crStyles.avatar}>
                    <Text style={crStyles.avatarText}>
                      {item.nickname.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={crStyles.playerName} numberOfLines={1}>
                    {item.nickname}
                  </Text>
                  <TouchableOpacity
                    style={crStyles.kick}
                    onPress={() => {
                      Alert.alert('להסיר?', `להסיר את ${item.nickname}?`, [
                        { text: 'ביטול', style: 'cancel' },
                        {
                          text: 'הסר', style: 'destructive',
                          onPress: () => {
                            getSocket()?.emit('kickPlayer', {
                              roomId: room.roomId, nickname: item.nickname,
                            });
                          },
                        },
                      ]);
                    }}
                  >
                    <Ionicons name="close" size={14} color="rgba(255,255,255,0.4)"/>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const crStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { justifyContent: 'center', alignItems: 'center', gap: 16 },
  loaderText: {
    fontFamily: fonts.num, fontSize: 12, fontWeight: '500',
    letterSpacing: 1.2, textTransform: 'uppercase', color: colors.inkMute,
  },

  scroll: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120,
    gap: 14,
  },

  // ── Main Card ──
  mainCard: {
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    borderRadius: radii.xl,
    padding: 24,
    gap: 16,
  },
  kicker: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    alignSelf: 'flex-end',
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(30,158,95,0.1)',
    borderWidth: 1, borderColor: 'rgba(30,158,95,0.25)',
    borderRadius: radii.pill,
  },
  kickerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ok },
  kickerText: {
    fontFamily: fonts.num, fontSize: 12, fontWeight: '600',
    color: colors.ok, letterSpacing: 0.4,
  },
  title: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 36, letterSpacing: -0.9, lineHeight: 38,
    color: colors.ink, textAlign: 'right',
  },
  sub: {
    fontFamily: fonts.body, fontSize: 14, lineHeight: 21,
    color: colors.ink3, textAlign: 'right',
  },

  // ── PIN box ──
  pinWrap: {
    backgroundColor: colors.cream,
    borderRadius: radii.lg,
    padding: 22,
    alignItems: 'center', gap: 14,
  },
  pinLabel: {
    fontFamily: fonts.num, fontSize: 12, fontWeight: '500',
    color: colors.ink3, textAlign: 'center',
  },
  pinRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  pinDigit: {
    width: 42, height: 56,
    backgroundColor: colors.paper,
    borderWidth: 2, borderColor: colors.ink,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 0,
    elevation: 5,
  },
  pinDigitText: {
    fontFamily: fonts.num, fontWeight: '700',
    fontSize: 28, color: colors.ink,
  },

  // ── Copy button ──
  actBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.12)',
    borderRadius: radii.pill,
  },
  actBtnCopied: {
    backgroundColor: colors.ok,
    borderColor: colors.ok,
  },
  actBtnText: {
    fontFamily: fonts.body, fontWeight: '600',
    fontSize: 14, color: colors.ink,
  },

  // ── Start (primary big) ──
  start: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    paddingVertical: 17, paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1, shadowRadius: 0,
    elevation: 6,
  },
  startDisabled: {
    backgroundColor: 'rgba(20,18,26,0.18)',
    shadowOpacity: 0.4,
    shadowColor: 'rgba(20,18,26,0.15)',
  },
  startIcon: { color: '#fff', fontSize: 13 },
  startText: { color: '#fff', fontFamily: fonts.display, fontSize: 17, fontWeight: '700' },
  startMeta: {
    fontFamily: fonts.num, fontSize: 13, fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },

  // ── Hint ──
  hint: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: 'rgba(229,156,0,0.1)',
    borderWidth: 1, borderColor: 'rgba(229,156,0,0.3)',
    borderRadius: radii.sm,
  },
  hintIcon: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.warn,
    alignItems: 'center', justifyContent: 'center',
  },
  hintText: { color: colors.warn, fontSize: 13, flex: 1, textAlign: 'right' },

  // ══ Roster (dark) ══
  roster: {
    backgroundColor: colors.ink,
    borderRadius: radii.xl,
    padding: 22,
    overflow: 'hidden',
    position: 'relative',
    gap: 16,
  },
  rosterBlob: {
    position: 'absolute',
    top: -100, right: -100, width: 240, height: 240,
    backgroundColor: colors.primary, borderRadius: 120, opacity: 0.2,
  },

  rosterLabel: {
    fontFamily: fonts.body, fontSize: 13,
    color: 'rgba(251,248,241,0.6)', textAlign: 'right',
  },
  rosterCount: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 68, lineHeight: 70, letterSpacing: -2.5,
    color: colors.ans3, textAlign: 'right', marginTop: 4,
  },
  rosterStatus: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    marginTop: 8,
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ans3 },
  rosterStatusText: {
    fontFamily: fonts.body, fontSize: 13,
    color: 'rgba(251,248,241,0.75)',
  },

  // Empty state
  rosterEmpty: {
    alignItems: 'center', gap: 14,
    paddingVertical: 28,
  },
  rosterEmptyText: {
    fontFamily: fonts.body, fontSize: 14, lineHeight: 21,
    color: 'rgba(251,248,241,0.7)', textAlign: 'center',
  },

  // Player item
  player: {
    flex: 1,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
  },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 14, color: '#fff',
  },
  playerName: {
    flex: 1, fontFamily: fonts.body, fontSize: 13, fontWeight: '600',
    color: colors.paper, textAlign: 'right',
  },
  kick: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
});
