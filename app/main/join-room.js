import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getSocket } from '../../utils/socket';
import { fonts, radii ,useThemeColors} from '../../constants/theme';
import { EpShape } from '../../components/EpBrand';

export default function JoinRoom() {
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId]     = useState('');
  const [error, setError]       = useState('');
  const [joining, setJoining]   = useState(false);
  const [room, setRoom]         = useState(null);

  const router = useRouter();

  const colors = useThemeColors();
  const joinStyles = getJoinStyles(colors);

  const roomRef = useRef(null);
  useEffect(() => { roomRef.current = room; }, [room]);

  useFocusEffect(useCallback(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRoomUpdated = (data) => {
      if (roomRef.current && data.roomId !== roomRef.current.roomId) 
        return;
      setRoom(data);
      if (data.phase === 'QUESTION') {
        router.replace(`/game/player/game?roomId=${data.roomId}`);
      }
    };
    socket.on('roomUpdated', handleRoomUpdated);

    return () => {
      socket.off('roomUpdated', handleRoomUpdated);
      setRoom(null);
    };
  }, []));

  const handleJoin = () => {
    const socket = getSocket();
    if (!socket) return setError('אין חיבור לשרת');
    if (!nickname.trim() || !roomId.trim()) {
      return setError('אנא מלאו שם וקוד חדר');
    }
    setError('');
    setJoining(true);
    socket.emit('joinRoom', { roomId: roomId.trim(), nickname: nickname.trim() }, (res) => {
      setJoining(false);
      if (!res.ok) setError(res.message);
    });
  };

  // ═══ Lobby  ═══════════════════════════════════
  if (room) {
    return (
      <View style={joinStyles.container}>
        <ScrollView contentContainerStyle={joinStyles.lobby} showsVerticalScrollIndicator={false}>

          <View style={joinStyles.you}>
            <View style={joinStyles.youBlob}/>
            <Text style={joinStyles.youLabel}>השם שלך בחדר</Text>
            <Text style={joinStyles.youName}>{nickname}</Text>
            <View style={joinStyles.youStatus}>
              <View style={joinStyles.pulseDot}/>
              <Text style={joinStyles.youStatusText}>
                ממתין שהמארח יתחיל את המשחק
              </Text>
            </View>
          </View>

          <View style={joinStyles.roster}>
            <View style={joinStyles.rosterHead}>
              <Text style={joinStyles.rosterTitle}>בחדר עכשיו</Text>
              <Text style={joinStyles.rosterCount}>
                {room.players.length} שחקנים
              </Text>
            </View>

            <FlatList
              data={room.players}
              keyExtractor={(p) => p.socketId || p.userId}
              numColumns={3}
              columnWrapperStyle={{ gap: 8 }}
              ItemSeparatorComponent={() => <View style={{ height: 8 }}/>}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const isYou = item.nickname === nickname;
                return (
                  <View style={[
                    joinStyles.player,
                    isYou && joinStyles.playerYou,
                  ]}>
                    <View style={[
                      joinStyles.avatar,
                      isYou && { backgroundColor: colors.primary },
                    ]}>
                      <Text style={[
                        joinStyles.avatarText,
                        isYou && { color: '#fff' },
                      ]}>
                        {item.nickname.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={joinStyles.playerName} numberOfLines={1}>
                      {item.nickname}
                    </Text>
                    {isYou && (
                      <View style={joinStyles.youTag}>
                        <Text style={joinStyles.youTagText}>אתה</Text>
                      </View>
                    )}
                  </View>
                );
              }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={joinStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={joinStyles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={joinStyles.formCard}>
          <View>
            <Text style={joinStyles.title}>
              הצטרף{'\n'}
              <Text style={{ color: colors.primary }}>לחדר.</Text>
            </Text>
            <Text style={joinStyles.sub}>
             הזן את קוד החדר שקיבלת מהמנחה ובחר לעצמך שם.
            </Text>
          </View>

          {/* Fields */}
          <View style={{ gap: 14, marginTop: 24 }}>
            <View>
              <Text style={joinStyles.label}>קוד חדר</Text>
              <TextInput
                style={joinStyles.pin}
                placeholder="000000"
                placeholderTextColor="rgba(20,18,26,0.18)"
                value={roomId}
                onChangeText={setRoomId}
                maxLength={6}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>

            <View>
              <Text style={joinStyles.label}>השם שלך</Text>
              <TextInput
                style={joinStyles.input}
                placeholder="לדוגמה: מתן"
                placeholderTextColor={colors.inkMute}
                textAlign="right"
                value={nickname}
                onChangeText={setNickname}
                maxLength={20}
                autoCorrect={false}
              />
            </View>

            {error ? (
              <View style={joinStyles.errorBox}>
                <View style={joinStyles.errorIcon}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>!</Text>
                </View>
                <Text style={joinStyles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={joinStyles.submit}
            activeOpacity={0.85}
            onPress={handleJoin}
            disabled={joining}
          >
            <Text style={joinStyles.submitText}>
              {joining ? 'מצטרף…' : 'להצטרפות למשחק'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getJoinStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120,
  },

  formCard: {
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    borderRadius: radii.xl,
    padding: 28,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 6,
  },

  kicker: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    marginBottom: 12,
  },
  kickerText: {
    fontFamily: fonts.num, fontSize: 12, fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.inkMute,
  },
  title: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 40, lineHeight: 42, letterSpacing: -0.9,
    color: colors.ink, textAlign: 'right',
  },
  sub: {
    fontFamily: fonts.body, fontSize: 14, lineHeight: 22,
    color: colors.ink3, marginTop: 10, textAlign: 'right',
  },

  label: {
    fontFamily: fonts.body, fontSize: 13, fontWeight: '600',
    color: colors.ink3, marginBottom: 8, textAlign: 'right',
  },
  input: {
    backgroundColor: colors.cream,
    borderWidth: 2, borderColor: colors.blackAlpha08,
    borderRadius: radii.md,
    paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: fonts.body, fontSize: 16, fontWeight: '500',
    color: colors.ink,
  },
  pin: {
    backgroundColor: colors.cream,
    borderWidth: 2, borderColor: colors.blackAlpha08,
    borderRadius: radii.md,
    paddingVertical: 16,
    fontFamily: fonts.num, fontSize: 28, fontWeight: '700',
    letterSpacing: 12,
    color: colors.ink,
    textAlign: 'center',
    writingDirection: 'ltr',
  },

  errorBox: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: 'rgba(214,58,45,0.08)',
    borderWidth: 1, borderColor: 'rgba(214,58,45,0.25)',
    borderRadius: radii.sm,
  },
  errorIcon: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.bad,
    alignItems: 'center', justifyContent: 'center',
  },
  errorText: { color: colors.bad, fontSize: 14, flex: 1, textAlign: 'right' },

  submit: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 17, paddingHorizontal: 22,
    borderRadius: radii.pill,
    marginTop: 22,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1, shadowRadius: 0,
    elevation: 6,
  },
  submitText: { color: '#fff', fontFamily: fonts.display, fontSize: 18, fontWeight: '700' },
  submitArrow: { color: '#fff', fontSize: 22, fontWeight: '700' },

  footer: {
    fontFamily: fonts.body, fontSize: 13, lineHeight: 19,
    color: colors.inkMute, textAlign: 'center', marginTop: 18,
  },

  lobby: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120,
    gap: 14,
  },
  you: {
    backgroundColor: colors.ink,
    borderRadius: radii.xl,
    padding: 26,
    position: 'relative',
    overflow: 'hidden',
  },
  youBlob: {
    position: 'absolute',
    top: -40, right: -60, width: 220, height: 220,
    backgroundColor: colors.ans3, borderRadius: 110, opacity: 0.18,
  },
  youLabel: {
    fontFamily: fonts.body, fontSize: 13,
    color: 'rgba(251,248,241,0.6)', fontWeight: '500',
    textAlign: 'right',
  },
  youName: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 40, letterSpacing: -0.8, lineHeight: 42,
    color: colors.ans3, marginVertical: 10, textAlign: 'right',
  },
  youStatus: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingTop: 14, marginTop: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)',
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.ans3 },
  youStatusText: {
    fontFamily: fonts.body, fontSize: 14,
    color: 'rgba(251,248,241,0.85)',
  },

  roster: {
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    borderRadius: radii.xl,
    padding: 20,
  },
  rosterHead: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'baseline', marginBottom: 14,
  },
  rosterTitle: {
    fontFamily: fonts.display, fontWeight: '700',
    fontSize: 17, color: colors.ink,
  },
  rosterCount: {
    fontFamily: fonts.num, fontSize: 13, fontWeight: '600',
    color: colors.inkMute,
  },

  player: {
    flex: 1, padding: 12,
    backgroundColor: colors.cream,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.05)',
    borderRadius: radii.md,
    alignItems: 'center', gap: 6,
  },
  playerYou: {
    backgroundColor: 'rgba(79,63,245,0.12)',
    borderColor: colors.primary,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 18, color: colors.ans3,
  },
  playerName: {
    fontSize: 12, fontWeight: '600', color: colors.ink,
    textAlign: 'center', width: '100%',
  },
  youTag: {
    paddingHorizontal: 8, paddingVertical: 2,
    backgroundColor: '#fff', borderRadius: radii.pill,
  },
  youTagText: {
    fontFamily: fonts.num, fontSize: 9, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase',
    color: colors.primary,
  },
});
