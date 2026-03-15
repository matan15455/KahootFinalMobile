import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getSocket } from '../../../utils/socket';
import ScoreBoard from '../../../components/ScoreBoard';

const ANSWER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];

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
        const update = () => {
          const remaining = Math.max(0, Math.ceil((roomData.endsAt - Date.now()) / 1000));
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

  // ── Guards ──────────────────────────────────────────
  if (!room) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22d3ee" />
        <Text style={styles.loadingText}>טוען משחק…</Text>
      </View>
    );
  }

  // ── END ─────────────────────────────────────────────
  if (room.phase === 'END') {
    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.phaseTitle}>🏁 המשחק הסתיים!</Text>
        <ScoreBoard players={room.players} />
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace('/main/join-room')}
        >
          <Text style={styles.homeBtnText}>חזור לדף הבית</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── SUMMARY ─────────────────────────────────────────
  if (room.phase === 'SUMMARY' && room.summary) {
    return (
      <View style={styles.container}>
        <Text style={styles.phaseTitle}>תוצאות השאלה</Text>

        <FlatList
          data={Object.entries(room.summary.answersCount)}
          keyExtractor={([ans]) => ans}
          contentContainerStyle={styles.summaryList}
          renderItem={({ item: [answer, count] }) => {
            const isCorrect = room.summary.correctAnswer === answer;
            const isMyWrong = selectedAnswer === answer && !isCorrect;
            return (
              <View style={[
                styles.summaryItem,
                isCorrect && styles.summaryCorrect,
                isMyWrong && styles.summaryWrong,
              ]}>
                <Text style={[
                  styles.summaryAnswer,
                  isCorrect && styles.summaryAnswerCorrect,
                  isMyWrong && styles.summaryAnswerWrong,
                ]}>
                  {answer}
                </Text>
                <View style={styles.summaryCountBadge}>
                  <Text style={styles.summaryCount}>{count}</Text>
                </View>
              </View>
            );
          }}
        />

        {/* תוצאה אישית */}
        <View style={styles.myResultBadge}>
          {selectedAnswer === room.summary.correctAnswer ? (
            <Text style={styles.myResultCorrect}>✅ תשובה נכונה!</Text>
          ) : selectedAnswer ? (
            <Text style={styles.myResultWrong}>❌ תשובה שגויה</Text>
          ) : (
            <Text style={styles.myResultTimeout}>⏱ לא ענית בזמן</Text>
          )}
        </View>
      </View>
    );
  }

  // ── SCORES ──────────────────────────────────────────
  if (room.phase === 'SCORES') {
    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <ScoreBoard players={room.players} />
        <Text style={styles.waitingText}>⏳ ממתינים למארח להמשיך…</Text>
      </ScrollView>
    );
  }

  // ── QUESTION ─────────────────────────────────────────
  if (room.phase === 'QUESTION' && room.question) {
    const danger = timeLeft !== null && timeLeft <= 5;
    const warning = timeLeft !== null && timeLeft <= 10 && timeLeft > 5;

    return (
      <View style={styles.container}>
        <Text style={styles.questionIndex}>שאלה {room.questionIndex + 1}</Text>

        {/* Timer */}
        {timeLeft !== null && (
          <View style={[
            styles.timerWrap,
            danger && styles.timerDanger,
            warning && styles.timerWarning,
          ]}>
            <Text style={styles.timerText}>{timeLeft}</Text>
          </View>
        )}

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{room.question.text}</Text>
        </View>

        {/* Status אחרי תשובה */}
        {selectedAnswer && (
          <View style={styles.answeredBadge}>
            <Text style={styles.answeredText}>✔ ענית: {selectedAnswer}</Text>
          </View>
        )}

        {/* Answers */}
        <View style={styles.answersGrid}>
          {room.question.answers.map((ans, index) => {
            const isSelected = selectedAnswer === ans.text;
            const isDisabled = !!selectedAnswer;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.answerBtn,
                  { backgroundColor: ANSWER_COLORS[index % ANSWER_COLORS.length] },
                  isSelected && styles.answerSelected,
                  isDisabled && !isSelected && styles.answerDimmed,
                ]}
                onPress={() => handleAnswer(ans.text)}
                disabled={isDisabled}
                activeOpacity={0.8}
              >
                <Text style={styles.answerBtnText}>{ans.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  // ── LOBBY / WAITING ──────────────────────────────────
  return (
    <View style={styles.container}>
      <Text style={styles.loadingText}>⏳ מחכים שהמארח יתחיל…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070e1a',
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#070e1a',
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(234,240,255,0.6)',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  phaseTitle: {
    color: '#eaf0ff',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
  },

  // Timer
  timerWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34,211,238,0.15)',
    borderWidth: 3,
    borderColor: '#22d3ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerWarning: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  timerDanger: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  timerText: { color: '#eaf0ff', fontSize: 30, fontWeight: '900' },

  // Question
  questionIndex: {
    color: 'rgba(234,240,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 1,
  },
  questionCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  questionText: {
    color: '#eaf0ff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
  },

  // Answered badge
  answeredBadge: {
    backgroundColor: 'rgba(34,211,238,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  answeredText: {
    color: '#22d3ee',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Answers grid
  answersGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  answerBtn: {
    width: '47.5%',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  answerSelected: {
    opacity: 1,
    borderWidth: 3,
    borderColor: '#fff',
  },
  answerDimmed: {
    opacity: 0.4,
  },
  answerBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },

  // Summary
  summaryList: { width: '100%', gap: 10, paddingBottom: 10 },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryCorrect: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    borderColor: 'rgba(52,211,153,0.4)',
  },
  summaryWrong: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  summaryAnswer: {
    color: '#eaf0ff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  summaryAnswerCorrect: { color: '#34d399', fontWeight: '800' },
  summaryAnswerWrong: { color: '#f87171' },
  summaryCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 10,
  },
  summaryCount: { color: '#eaf0ff', fontSize: 15, fontWeight: '800' },

  // My result
  myResultBadge: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    width: '100%',
    alignItems: 'center',
  },
  myResultCorrect: { color: '#34d399', fontSize: 18, fontWeight: '900' },
  myResultWrong: { color: '#f87171', fontSize: 18, fontWeight: '900' },
  myResultTimeout: { color: 'rgba(234,240,255,0.5)', fontSize: 18, fontWeight: '700' },

  // Waiting
  waitingText: {
    color: 'rgba(234,240,255,0.5)',
    fontSize: 15,
    marginTop: 20,
    textAlign: 'center',
  },

  // Home / End
  homeBtn: {
    backgroundColor: 'rgba(124,58,237,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
    borderRadius: 18,
    paddingHorizontal: 36,
    paddingVertical: 16,
    marginTop: 24,
  },
  homeBtnText: { color: '#eaf0ff', fontSize: 17, fontWeight: '800' },
});