import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getSocket } from '../../../utils/socket';
import ScoreBoard from '../../../components/ScoreBoard';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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

  const handleNext = () => {
    const socket = getSocket();
    if (!socket || !room) return;
    socket.emit('nextQuestion', { roomId });
  };

  /* =====================================================
     UI Guards (Loading)
  ===================================================== */
  if (!room) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#070815']} style={StyleSheet.absoluteFill} />
        <View style={[styles.glassPanel, styles.centered]}>
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
        <View style={styles.glassPanel}>
          <Text style={styles.titleGlow}>🎉 החידון הסתיים! 🎉</Text>
          <View style={styles.tableWrapper}>
            <ScoreBoard players={room.players} />
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.replace('/main/my-quizzes')}>
            <LinearGradient colors={['#8b5cf6', '#6d28d9']} style={styles.btnGradient}>
              <Text style={styles.actionBtnText}>חזור לחידונים</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* =====================================================
     SUMMARY (Bar Chart ב-React Native)
  ===================================================== */
  if (room.phase === 'SUMMARY' && room.summary) {
    const counts = Object.values(room.summary.answersCount);
    const maxCount = Math.max(...counts, 1);

    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0f172a', '#070815']} style={StyleSheet.absoluteFill} />
        <View style={styles.glassPanel}>
          <Text style={styles.titleGlow}>תוצאות השאלה</Text>
          
          <View style={styles.chartContainer}>
            {Object.entries(room.summary.answersCount).map(([answer, count], index) => {
              const isCorrect = room.summary.correctAnswer === answer;
              const heightPercent = count === 0 ? 5 : (count / maxCount) * 100;

              return (
                <View key={answer} style={styles.barColumn}>
                  <Text style={styles.barCountLabel}>{count}</Text>
                  
                  <View style={styles.barTrack}>
                    <View 
                      style={[
                        styles.barFill, 
                        { height: `${heightPercent}%` },
                        isCorrect ? styles.correctBarFill : null
                      ]} 
                    />
                  </View>
                  
                  <Text style={styles.barAnswerLabel} numberOfLines={2}>
                    {answer}
                  </Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={handleNext}>
            <LinearGradient colors={['#22d3ee', '#0ea5e9']} style={styles.btnGradient}>
              <Text style={styles.actionBtnText}>הצג ניקוד ▶</Text>
            </LinearGradient>
          </TouchableOpacity>
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
        <View style={styles.glassPanel}>
          <Text style={styles.titleGlow}>טבלת מובילים 🏆</Text>
          <View style={styles.tableWrapper}>
            <ScoreBoard players={room.players} />
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={handleNext}>
            <LinearGradient colors={['#22d3ee', '#0ea5e9']} style={styles.btnGradient}>
              <Text style={styles.actionBtnText}>המשך ▶</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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

        <View style={styles.answersGrid}>
          {room.question.answers.map((ans, idx) => (
            <TouchableOpacity 
              activeOpacity={0.9}
              key={idx} 
              style={[styles.answerCard, { backgroundColor: getShapeColor(idx) }]}
            >
              <Text style={styles.answerText}>{ans.text}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.gameFooter}>
          <TouchableOpacity style={styles.skipBtn} onPress={handleNext}>
            <Text style={styles.skipBtnText}>סיים שאלה ⏭</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* =====================================================
     LOBBY / FALLBACK
  ===================================================== */
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#070815']} style={StyleSheet.absoluteFill} />
      <View style={[styles.glassPanel, styles.centered]}>
        <Text style={styles.titleGlow}>⏳ ממתין לתחילת המשחק...</Text>
        <Text style={styles.subtitle}>היכנסו עכשיו והתכוננו!</Text>
      </View>
    </View>
  );
}

// פונקציית עזר לצבעי התשובות כמו באתר (אדום, כחול, צהוב, ירוק)
function getShapeColor(index) {
  const colors = ['#e21b3c', '#1368ce', '#d89e00', '#26890c'];
  return colors[index % colors.length];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    justifyContent: 'center',
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
  /* --- Bar Chart Styles --- */
  chartContainer: {
    flexDirection: 'row-reverse', // כדי שהעמודה הראשונה תהיה מימין כמו בעברית
    height: 250,
    width: '100%',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    marginVertical: 20,
  },
  barColumn: {
    alignItems: 'center',
    width: 60,
  },
  barTrack: {
    height: 160,
    width: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#cbd5e1',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  correctBarFill: {
    backgroundColor: '#34d399', // ירוק זוהר לתשובה נכונה
  },
  barCountLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  barAnswerLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    height: 32,
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
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 4,
  },
  mainQuestionText: {
    color: '#333',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
  },
  answersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  answerCard: {
    width: '48%',
    minHeight: 110,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  answerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  gameFooter: {
    marginTop: 'auto',
    marginBottom: 20,
    alignItems: 'center',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  skipBtnText: {
    color: '#eaf0ff',
    fontSize: 14,
    fontWeight: '600',
  },
});