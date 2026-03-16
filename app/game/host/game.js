import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getSocket } from '../../../utils/socket';
import ScoreBoard from '../../../components/ScoreBoard';

export default function HostGame() {
  const [room, setRoom] = useState(null);
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

      if (roomData.endsAt) {
        clearInterval(timerRef.current);
        const offset = Date.now() - roomData.serverTime; // הפרש שעונים
        const correctedEndsAt = roomData.endsAt + offset; // מתקן

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

  const handleNext = () => {
    const socket = getSocket();
    if (!socket || !room) return;
    socket.emit('nextQuestion', { roomId });
  };

  if (!room) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22d3ee" />
        <Text style={styles.loadingText}>טוען משחק…</Text>
      </View>
    );
  }

  if (room.phase === 'END') {
    return (
      <View style={styles.container}>
        <Text style={styles.phaseTitle}>🏁 החידון הסתיים!</Text>
        <ScoreBoard players={room.players} />
        <TouchableOpacity style={styles.endBtn} onPress={() => router.replace('/main/my-quizzes')}>
          <Text style={styles.endBtnText}>חזור לחידונים</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
            return (
              <View style={[styles.summaryItem, isCorrect && styles.summaryCorrect]}>
                <Text style={[styles.summaryAnswer, isCorrect && styles.summaryAnswerCorrect]}>
                  {answer}
                </Text>
                <View style={styles.summaryCountBadge}>
                  <Text style={styles.summaryCount}>{count}</Text>
                </View>
              </View>
            );
          }}
        />
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>הצג ניקוד ▶</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (room.phase === 'SCORES') {
    return (
      <View style={styles.container}>
        <ScoreBoard players={room.players} />
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>המשך ▶</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (room.phase === 'QUESTION' && room.question) {
    const danger = timeLeft !== null && timeLeft <= 5;
    const warning = timeLeft !== null && timeLeft <= 10 && timeLeft > 5;

    return (
      <View style={styles.container}>
        <Text style={styles.questionIndex}>שאלה {room.questionIndex + 1}</Text>

        {timeLeft !== null && (
          <View style={[styles.timerWrap, danger && styles.timerDanger, warning && styles.timerWarning]}>
            <Text style={styles.timerText}>{timeLeft}</Text>
          </View>
        )}

        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{room.question.text}</Text>
        </View>

        <View style={styles.answersGrid}>
          {room.question.answers.map((ans, index) => (
            <View
              key={String(index)}
              style={[styles.answerTile, { backgroundColor: tileColor(index) }]}
            >
              <Text style={styles.answerTileText}>{ans.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>סיים שאלה ▶</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.loadingText}>⏳ ממתין לתחילת המשחק…</Text>
    </View>
  );
}

function tileColor(i) {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
  return colors[i % colors.length];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070815',
    paddingTop: 60,
    paddingHorizontal: 20,
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
  timerWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34,211,238,0.15)',
    borderWidth: 3,
    borderColor: '#22d3ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  timerWarning: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.15)' },
  timerDanger: { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.15)' },
  timerText: { color: '#eaf0ff', fontSize: 30, fontWeight: '900' },
  questionIndex: {
    color: 'rgba(234,240,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 1,
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  questionText: {
    color: '#eaf0ff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },
  answersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  answerTile: {
    width: '47.5%',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
  },
  answerTileText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  nextBtn: {
    backgroundColor: 'rgba(34,211,238,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.4)',
    borderRadius: 18,
    paddingHorizontal: 36,
    paddingVertical: 16,
    marginTop: 16,
    alignSelf: 'center',
  },
  nextBtnText: { color: '#eaf0ff', fontSize: 17, fontWeight: '800' },
  endBtn: {
    backgroundColor: 'rgba(124,58,237,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
    borderRadius: 18,
    paddingHorizontal: 36,
    paddingVertical: 16,
    marginTop: 20,
    alignSelf: 'center',
  },
  endBtnText: { color: '#eaf0ff', fontSize: 17, fontWeight: '800' },
  summaryList: { gap: 10, paddingBottom: 10 },
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
  summaryAnswer: { color: '#eaf0ff', fontSize: 15, fontWeight: '600', flex: 1, textAlign: 'right' },
  summaryAnswerCorrect: { color: '#34d399', fontWeight: '800' },
  summaryCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 10,
  },
  summaryCount: { color: '#eaf0ff', fontSize: 15, fontWeight: '800' },
});