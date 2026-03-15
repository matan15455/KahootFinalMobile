import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { SERVER_URL } from '../../utils/socket';
import { Ionicons } from '@expo/vector-icons';

const DIFFICULTIES = [
  { label: 'קל', value: 'easy' },
  { label: 'בינוני', value: 'medium' },
  { label: 'קשה', value: 'hard' },
];

const NUM_QUESTIONS = [5, 10, 15, 20];

export default function CreateAI() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // תוצאה מה-AI
  const [generatedQuiz, setGeneratedQuiz] = useState(null);

  const { token } = useAuth();
  const router = useRouter();

  // ─── יצירה עם AI ────────────────────────────────────────
  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert('שגיאה', 'אנא הכנס נושא לשאלון');
      return;
    }
    try {
      setGenerating(true);
      setGeneratedQuiz(null);

      const res = await axios.post(`${SERVER_URL}/ai/generate-quiz`, {
        topic,
        difficulty,
        numQuestions,
      });

      // המרת פורמט AI לפורמט השרת שלנו
      const questions = res.data.questions.map((q) => ({
        text: q.text,
        type: 'multiple-choice',
        time: 30,
        points: 1,
        answers: q.options.map((opt, i) => ({
          text: opt,
          isCorrect: i === q.correctIndex,
        })),
      }));

      setGeneratedQuiz({
        title: res.data.title || topic,
        description: res.data.description || '',
        questions,
      });

    } catch (err) {
      Alert.alert('שגיאה', 'שגיאה ביצירת השאלון עם AI');
    } finally {
      setGenerating(false);
    }
  };

  // ─── שמירה לשרת ─────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.post(
        `${SERVER_URL}/quizzes`,
        generatedQuiz,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('✅ הצלחה', 'השאלון נשמר בהצלחה', [
        { text: 'אישור', onPress: () => router.replace('/main/my-quizzes') }
      ]);
    } catch (err) {
      Alert.alert('שגיאה', err.response?.data?.message || 'שגיאה בשמירת השאלון');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#eaf0ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>יצירה עם AI ✨</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── טופס הגדרות ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>הגדרות השאלון</Text>

          <Text style={styles.label}>נושא</Text>
          <TextInput
            style={styles.input}
            placeholder="לדוגמה: היסטוריה של ישראל, כדורגל, מדע..."
            placeholderTextColor="rgba(234,240,255,0.4)"
            value={topic}
            onChangeText={setTopic}
            textAlign="right"
            multiline
          />

          <Text style={styles.label}>רמת קושי</Text>
          <View style={styles.pillRow}>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[styles.pill, difficulty === d.value && styles.pillActive]}
                onPress={() => setDifficulty(d.value)}
              >
                <Text style={[styles.pillText, difficulty === d.value && styles.pillTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>מספר שאלות</Text>
          <View style={styles.pillRow}>
            {NUM_QUESTIONS.map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.pill, numQuestions === n && styles.pillActive]}
                onPress={() => setNumQuestions(n)}
              >
                <Text style={[styles.pillText, numQuestions === n && styles.pillTextActive]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.generateBtn, generating && styles.btnDisabled]}
            onPress={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.generateBtnText}>יוצר שאלון...</Text>
              </View>
            ) : (
              <View style={styles.loadingRow}>
                <Ionicons name="sparkles-outline" size={18} color="#eaf0ff" />
                <Text style={styles.generateBtnText}>צור שאלון</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── תצוגת תוצאה ── */}
        {generatedQuiz && (
          <View style={styles.resultCard}>

            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={22} color="#22d3ee" />
              <Text style={styles.resultTitle}>{generatedQuiz.title}</Text>
            </View>

            {generatedQuiz.description ? (
              <Text style={styles.resultDesc}>{generatedQuiz.description}</Text>
            ) : null}

            <View style={styles.resultMeta}>
              <Ionicons name="help-circle-outline" size={15} color="#22d3ee" />
              <Text style={styles.resultMetaText}>
                {generatedQuiz.questions.length} שאלות נוצרו
              </Text>
            </View>

            {/* רשימת שאלות */}
            {generatedQuiz.questions.map((q, i) => (
              <View key={i} style={styles.questionItem}>
                <View style={styles.questionNum}>
                  <Text style={styles.questionNumText}>{i + 1}</Text>
                </View>
                <View style={styles.questionContent}>
                  <Text style={styles.questionText} numberOfLines={2}>
                    {q.text}
                  </Text>
                  <Text style={styles.questionAnswers}>
                    {q.answers.find(a => a.isCorrect)?.text}
                  </Text>
                </View>
              </View>
            ))}

            {/* כפתורים */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.regenerateBtn}
                onPress={handleGenerate}
                disabled={generating}
              >
                <Ionicons name="refresh-outline" size={16} color="rgba(234,240,255,0.7)" />
                <Text style={styles.regenerateBtnText}>צור מחדש</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>שמור שאלון</Text>
                )}
              </TouchableOpacity>
            </View>

          </View>
        )}

      </ScrollView>
    </View>
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
  scroll: {
    padding: 20,
    paddingBottom: 60,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#eaf0ff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 16,
  },
  label: {
    color: 'rgba(234,240,255,0.6)',
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    padding: 16,
    color: '#eaf0ff',
    fontSize: 15,
    marginBottom: 16,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    justifyContent: 'flex-end',
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  pillActive: {
    backgroundColor: 'rgba(34,211,238,0.2)',
    borderColor: '#22d3ee',
  },
  pillText: {
    color: 'rgba(234,240,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#22d3ee',
  },
  generateBtn: {
    backgroundColor: 'rgba(167,139,250,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.4)',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  generateBtnText: {
    color: '#eaf0ff',
    fontSize: 16,
    fontWeight: '800',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  // ── result ──
  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.2)',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    justifyContent: 'flex-end',
  },
  resultTitle: {
    color: '#eaf0ff',
    fontSize: 18,
    fontWeight: '900',
  },
  resultDesc: {
    color: 'rgba(234,240,255,0.55)',
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 12,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  resultMetaText: {
    color: '#22d3ee',
    fontSize: 13,
    fontWeight: '600',
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  questionNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(167,139,250,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionNumText: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: '800',
  },
  questionContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  questionText: {
    color: '#eaf0ff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  questionAnswers: {
    color: '#22d3ee',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'right',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  regenerateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  regenerateBtnText: {
    color: 'rgba(234,240,255,0.7)',
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(34,211,238,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  saveBtnText: {
    color: '#eaf0ff',
    fontSize: 15,
    fontWeight: '800',
  },
});