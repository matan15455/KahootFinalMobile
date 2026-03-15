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

// ─── שלב 1: טופס פרטי שאלון ───────────────────────────────
function QuizForm({ onNext }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleNext = () => {
    if (!title.trim()) {
      Alert.alert('שגיאה', 'אנא מלא שם לחידון');
      return;
    }
    onNext({ title, description });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>פרטי השאלון</Text>

      <TextInput
        style={styles.input}
        placeholder="שם השאלון"
        placeholderTextColor="rgba(234,240,255,0.4)"
        value={title}
        onChangeText={setTitle}
        textAlign="right"
      />

      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="תיאור (אופציונלי)"
        placeholderTextColor="rgba(234,240,255,0.4)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        textAlign="right"
        textAlignVertical="top"
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
        <Text style={styles.primaryBtnText}>המשך להוספת שאלות ←</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── טופס שאלה בודדת ──────────────────────────────────────
function QuestionForm({ onAdd, onCancel }) {
  const [text, setText] = useState('');
  const [time, setTime] = useState('30');
  const [points, setPoints] = useState('1');
  const [answers, setAnswers] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);

  const updateAnswerText = (index, value) => {
    const updated = [...answers];
    updated[index] = { ...updated[index], text: value };
    setAnswers(updated);
  };

  const setCorrect = (index) => {
    setAnswers(answers.map((a, i) => ({ ...a, isCorrect: i === index })));
  };

  const addAnswer = () => {
    if (answers.length >= 6) return;
    setAnswers([...answers, { text: '', isCorrect: false }]);
  };

  const removeAnswer = (index) => {
    if (answers.length <= 2) return;
    setAnswers(answers.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    if (!text.trim()) {
      Alert.alert('שגיאה', 'אנא מלא טקסט שאלה');
      return;
    }
    if (answers.some(a => !a.text.trim())) {
      Alert.alert('שגיאה', 'כל התשובות חייבות להכיל טקסט');
      return;
    }
    if (!answers.some(a => a.isCorrect)) {
      Alert.alert('שגיאה', 'חייב לסמן תשובה נכונה אחת');
      return;
    }

    onAdd({
      text,
      type: 'multiple-choice',
      time: parseInt(time) || 30,
      points: parseInt(points) || 1,
      answers,
    });
  };

  return (
    <View style={styles.questionForm}>
      <Text style={styles.sectionTitle}>שאלה חדשה</Text>

      <TextInput
        style={styles.input}
        placeholder="טקסט השאלה"
        placeholderTextColor="rgba(234,240,255,0.4)"
        value={text}
        onChangeText={setText}
        textAlign="right"
        multiline
      />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>זמן (שניות)</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            keyboardType="numeric"
            textAlign="center"
          />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>נקודות</Text>
          <TextInput
            style={styles.input}
            value={points}
            onChangeText={setPoints}
            keyboardType="numeric"
            textAlign="center"
          />
        </View>
      </View>

      <Text style={styles.label}>תשובות</Text>
      {answers.map((answer, index) => (
        <View key={index} style={styles.answerRow}>
          <TouchableOpacity
            style={[styles.correctBtn, answer.isCorrect && styles.correctBtnActive]}
            onPress={() => setCorrect(index)}
          >
            <Ionicons
              name={answer.isCorrect ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={answer.isCorrect ? '#22d3ee' : 'rgba(234,240,255,0.3)'}
            />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, styles.answerInput, answer.isCorrect && styles.answerInputCorrect]}
            placeholder={`תשובה ${index + 1}`}
            placeholderTextColor="rgba(234,240,255,0.4)"
            value={answer.text}
            onChangeText={(v) => updateAnswerText(index, v)}
            textAlign="right"
          />

          <TouchableOpacity onPress={() => removeAnswer(index)}>
            <Ionicons name="trash-outline" size={20} color="rgba(251,113,133,0.7)" />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addAnswerBtn} onPress={addAnswer}>
        <Ionicons name="add" size={18} color="#22d3ee" />
        <Text style={styles.addAnswerText}>הוסף תשובה</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <TouchableOpacity style={[styles.halfBtn, styles.cancelBtn]} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>בטל</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.halfBtn, styles.primaryBtn]} onPress={handleAdd}>
          <Text style={styles.primaryBtnText}>הוסף שאלה</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── מסך ראשי ─────────────────────────────────────────────
export default function CreateManual() {
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [saving, setSaving] = useState(false);

  const { token } = useAuth();
  const router = useRouter();

  const handleAddQuestion = (q) => {
    setQuestions([...questions, q]);
    setAddingQuestion(false);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (questions.length === 0) {
      Alert.alert('שגיאה', 'הוסף לפחות שאלה אחת');
      return;
    }
    try {
      setSaving(true);
      await axios.post(
        `${SERVER_URL}/quizzes`,
        { ...quiz, questions },
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
        <Text style={styles.headerTitle}>יצירה ידנית</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* שלב 1: אם עדיין אין quiz */}
        {!quiz && (
          <QuizForm onNext={(data) => setQuiz(data)} />
        )}

        {/* שלב 2: אחרי שהוגדר quiz */}
        {quiz && (
          <>
            <View style={styles.quizInfo}>
              <Text style={styles.quizTitle}>{quiz.title}</Text>
              <Text style={styles.quizCount}>{questions.length} שאלות</Text>
            </View>

            {/* רשימת שאלות */}
            {questions.map((q, i) => (
              <View key={i} style={styles.questionItem}>
                <View style={styles.questionItemLeft}>
                  <Text style={styles.questionNum}>{i + 1}</Text>
                </View>
                <View style={styles.questionItemMiddle}>
                  <Text style={styles.questionText} numberOfLines={2}>{q.text}</Text>
                  <Text style={styles.questionMeta}>{q.points} נקודות • {q.time}s</Text>
                </View>
                <TouchableOpacity onPress={() => removeQuestion(i)}>
                  <Ionicons name="trash-outline" size={20} color="rgba(251,113,133,0.7)" />
                </TouchableOpacity>
              </View>
            ))}

            {/* טופס שאלה חדשה */}
            {addingQuestion ? (
              <QuestionForm
                onAdd={handleAddQuestion}
                onCancel={() => setAddingQuestion(false)}
              />
            ) : (
              <TouchableOpacity
                style={styles.addQuestionBtn}
                onPress={() => setAddingQuestion(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#22d3ee" />
                <Text style={styles.addQuestionText}>הוסף שאלה</Text>
              </TouchableOpacity>
            )}

            {/* כפתור שמירה */}
            {!addingQuestion && (
              <TouchableOpacity
                style={[styles.primaryBtn, styles.saveBtn]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryBtnText}>שמור שאלון</Text>
                }
              </TouchableOpacity>
            )}
          </>
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
  section: {
    gap: 14,
  },
  sectionTitle: {
    color: '#eaf0ff',
    fontSize: 18,
    fontWeight: '800',
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
    marginBottom: 12,
  },
  textarea: {
    minHeight: 80,
  },
  label: {
    color: 'rgba(234,240,255,0.6)',
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfField: {
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: 'rgba(34,211,238,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#eaf0ff',
    fontSize: 16,
    fontWeight: '800',
  },
  // ── answer row ──
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  answerInput: {
    flex: 1,
    marginBottom: 0,
  },
  answerInputCorrect: {
    borderColor: 'rgba(34,211,238,0.5)',
    backgroundColor: 'rgba(34,211,238,0.08)',
  },
  correctBtn: {
    padding: 2,
  },
  correctBtnActive: {},
  addAnswerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.3)',
    borderRadius: 14,
    borderStyle: 'dashed',
  },
  addAnswerText: {
    color: '#22d3ee',
    fontSize: 14,
    fontWeight: '600',
  },
  halfBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cancelBtnText: {
    color: 'rgba(234,240,255,0.7)',
    fontSize: 15,
    fontWeight: '700',
  },
  // ── question list ──
  quizInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  quizTitle: {
    color: '#eaf0ff',
    fontSize: 20,
    fontWeight: '900',
  },
  quizCount: {
    color: '#22d3ee',
    fontSize: 14,
    fontWeight: '700',
  },
  questionForm: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  questionItemLeft: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(34,211,238,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionNum: {
    color: '#22d3ee',
    fontSize: 13,
    fontWeight: '800',
  },
  questionItemMiddle: {
    flex: 1,
    alignItems: 'flex-end',
  },
  questionText: {
    color: '#eaf0ff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  questionMeta: {
    color: 'rgba(234,240,255,0.45)',
    fontSize: 12,
    marginTop: 2,
  },
  addQuestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.3)',
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  addQuestionText: {
    color: '#22d3ee',
    fontSize: 15,
    fontWeight: '700',
  },
  saveBtn: {
    marginTop: 8,
  },
});