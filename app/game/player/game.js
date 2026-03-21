import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getSocket } from '../../../utils/socket';
import ScoreBoard from '../../../components/ScoreBoard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// צבעים בסגנון Kahoot
const ANSWER_COLORS = ['#e21b3c', '#1368ce', '#d89e00', '#26890c'];

export default function PlayerGame() {
  const [room, setRoom] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const router = useRouter();
  const { roomId } = useLocalSearchParams();
  const timerRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !roomId) return;

    const handleRoomUpdated = (roomData) => {
      if (roomData.roomId !== roomId) return;

      setRoom(roomData);

      if (roomData.phase === 'QUESTION') {
        setSelectedAnswer(null);
      }

      if (roomData.endsAt) {
        clearInterval(timerRef.current);

        const offset = Date.now() - roomData.serverTime;
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

    socket.on('roomUpdated', handleRoomUpdated);
    socket.emit('requestRoomState', { roomId });

    return () => {
      socket.off('roomUpdated', handleRoomUpdated);
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

  /* =====================================================
     UI Guards (Loading)
  ===================================================== */
  if (!room) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#070815']} style={StyleSheet.absoluteFill} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#22d3ee" />
          <Text style={styles.loadingText}>טוען משחק…</Text>
        </View>
      </View>
    );
  }

  /* =====================================================
     END
  ===================================================== */
  if (room.phase === 'END') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#070815']} style={StyleSheet.absoluteFill} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.glassPanel}>
            <Text style={styles.titleGlow}>🏁 המשחק הסתיים!</Text>
            <View style={styles.tableWrapper}>
                <ScoreBoard players={room.players} />
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.replace('/main/join-room')}>
              <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.btnGradient}>
                <Text style={styles.actionBtnText}>חזור לדף הבית</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  /* =====================================================
     SUMMARY (תוצאות אישיות)
  ===================================================== */
  if (room.phase === 'SUMMARY' && room.summary) {
    const isCorrect = selectedAnswer === room.summary.correctAnswer;
    const isTimeout = !selectedAnswer;

    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#070815']} style={StyleSheet.absoluteFill} />
        <View style={[styles.glassPanel, { flex: 1, marginTop: 40, marginBottom: 20 }]}>
          
          <Text style={styles.titleGlow}>תוצאות</Text>

          {/* חיווי מרכזי לשחקן */}
          <View style={[
              styles.feedbackCircle, 
              isCorrect ? styles.feedbackCorrect : isTimeout ? styles.feedbackTimeout : styles.feedbackWrong
          ]}>
             <Ionicons 
                name={isCorrect ? "checkmark-circle" : isTimeout ? "time" : "close-circle"} 
                size={80} 
                color="#fff" 
             />
             <Text style={styles.feedbackText}>
                {isCorrect ? 'כל הכבוד!' : isTimeout ? 'זמן עבר!' : 'לא נורא...'}
             </Text>
          </View>

          <View style={styles.resultDetails}>
            <Text style={styles.resultDetailsLabel}>התשובה הנכונה הייתה:</Text>
            <Text style={styles.resultDetailsCorrectText}>{room.summary.correctAnswer}</Text>
          </View>

           <Text style={styles.waitingText}>ממתינים למארח...</Text>
        </View>
      </View>
    );
  }

  /* =====================================================
     SCORES
  ===================================================== */
  if (room.phase === 'SCORES') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#070815']} style={StyleSheet.absoluteFill} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.glassPanel}>
             <Text style={styles.titleGlow}>טבלת מובילים 🏆</Text>
             <View style={styles.tableWrapper}>
                <ScoreBoard players={room.players} />
             </View>
             <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color="#22d3ee" />
                <Text style={[styles.waitingText, {marginTop: 0, marginLeft: 10}]}>ממתינים לשאלה הבאה…</Text>
             </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  /* =====================================================
     QUESTION
  ===================================================== */
  if (room.phase === 'QUESTION' && room.question) {
    const isDanger = timeLeft !== null && timeLeft <= 5;
    const isWarning = timeLeft !== null && timeLeft <= 10 && timeLeft > 5;

    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#070815']} style={StyleSheet.absoluteFill} />
        
        <View style={styles.gameHeader}>
          <View style={styles.questionBadge}>
            <Text style={styles.questionBadgeText}>שאלה {room.questionIndex + 1}</Text>
          </View>
          
          {timeLeft !== null && (
            <View style={[
              styles.megaTimer, 
              isDanger && styles.timerDanger, 
              isWarning && styles.timerWarning
            ]}>
              <Text style={[
                styles.timerNumber, 
                isDanger && { color: '#ef4444' },
                isWarning && { color: '#f59e0b' }
              ]}>{timeLeft}</Text>
            </View>
          )}
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.mainQuestionText}>{room.question.text}</Text>
        </View>

        {selectedAnswer ? (
          <View style={styles.waitingForOthersContainer}>
            <Ionicons name="checkmark-done-circle" size={60} color="#22d3ee" />
            <Text style={styles.waitingForOthersText}>התשובה נקלטה!</Text>
            <Text style={styles.waitingSubText}>ממתינים לשאר השחקנים...</Text>
          </View>
        ) : (
          <View style={styles.answersGrid}>
            {room.question.answers.map((ans, idx) => (
              <TouchableOpacity 
                activeOpacity={0.8}
                key={idx} 
                style={[styles.answerCard, { backgroundColor: ANSWER_COLORS[idx % ANSWER_COLORS.length] }]}
                onPress={() => handleAnswer(ans.text)}
              >
                <Text style={styles.answerText}>{ans.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }

  /* =====================================================
     LOBBY / FALLBACK
  ===================================================== */
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#070815']} style={StyleSheet.absoluteFill} />
      <View style={[styles.glassPanel, styles.centered, {marginHorizontal: 20}]}>
        <Text style={styles.titleGlow}>⏳ תכף מתחילים...</Text>
        <Text style={styles.subtitle}>הסתכלו על המסך של המארח</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
  },
  glassPanel: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  titleGlow: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(34,211,238,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: 'rgba(234,240,255,0.7)',
    fontSize: 16,
    marginTop: 10,
  },
  loadingText: {
    color: 'rgba(234,240,255,0.6)',
    fontSize: 18,
    marginTop: 16,
  },
  tableWrapper: {
    width: '100%',
    marginBottom: 20,
    minHeight: 150,
  },
  actionBtn: {
    width: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
  },
  btnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  /* --- Feedback UI (SUMMARY) --- */
  feedbackCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  feedbackCorrect: {
    backgroundColor: '#34d399',
    shadowColor: '#34d399',
  },
  feedbackWrong: {
    backgroundColor: '#f87171',
    shadowColor: '#f87171',
  },
  feedbackTimeout: {
    backgroundColor: '#94a3b8',
    shadowColor: '#94a3b8',
  },
  feedbackText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 10,
  },
  resultDetails: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  resultDetailsLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 8,
  },
  resultDetailsCorrectText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  waitingText: {
    color: 'rgba(234,240,255,0.5)',
    fontSize: 16,
    marginTop: 20,
  },
  /* --- Question & Timer Styles --- */
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  questionBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  questionBadgeText: {
    color: '#eaf0ff',
    fontWeight: '700',
  },
  megaTimer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: '#22d3ee',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(34,211,238,0.1)',
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  timerWarning: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245,158,11,0.1)',
    shadowColor: '#f59e0b',
  },
  timerDanger: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239,68,68,0.1)',
    shadowColor: '#ef4444',
  },
  timerNumber: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 4,
    minHeight: 100,
    justifyContent: 'center',
  },
  mainQuestionText: {
    color: '#333',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
  },
  answersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  answerCard: {
    width: '48%',
    minHeight: 120,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  answerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  waitingForOthersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(34,211,238,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.2)',
    marginTop: 20,
    maxHeight: 250,
  },
  waitingForOthersText: {
    color: '#22d3ee',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 10,
  },
  waitingSubText: {
    color: 'rgba(234,240,255,0.6)',
    fontSize: 16,
    marginTop: 8,
  }
});