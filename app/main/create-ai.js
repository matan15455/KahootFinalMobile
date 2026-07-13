import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { SERVER_URL } from '../../utils/socket';
import { colors, fonts, radii } from '../../constants/theme';
import { EpShape, ANSWER_META } from '../../components/EpBrand';
import { Ionicons } from '@expo/vector-icons';

const POINTS_OPTIONS = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];


function EditableQuestion({ q, index, onChange, onRemove }) {
  const updateField = (field, value) => {
    onChange(index, { ...q, [field]: field === 'text' ? value : Number(value) });
  };

  const updateAnswerText = (aIdx, value) => {
    const updated = [...q.answers];
    updated[aIdx] = { ...updated[aIdx], text: value };
    onChange(index, { ...q, answers: updated });
  };

  const setCorrect = (aIdx) => {
    const updated = q.answers.map((a, i) => ({ ...a, isCorrect: i === aIdx }));
    onChange(index, { ...q, answers: updated });
  };

  const addAnswer = () => {
    if (q.answers.length >= 8) return;
    onChange(index, { ...q, answers: [...q.answers, { text: '', isCorrect: false }] });
  };

  const removeAnswer = (aIdx) => {
    if (q.answers.length <= 2) return;
    const wasCorrect = q.answers[aIdx].isCorrect;
    let updated = q.answers.filter((_, i) => i !== aIdx);
    if (wasCorrect && !updated.some(a => a.isCorrect)) {
      updated[0] = { ...updated[0], isCorrect: true };
    }
    onChange(index, { ...q, answers: updated });
  };

  return (
    <View style={eqStyles.card}>
      <View style={eqStyles.headRow}>
        <Text style={eqStyles.qNum}>שאלה {String(index + 1).padStart(2, '0')}</Text>
        <View style={eqStyles.headEnd}>
          <View style={eqStyles.aiBadge}>
            <Text style={eqStyles.aiBadgeText}>✦ AI</Text>
          </View>
          <TouchableOpacity style={eqStyles.delBtn} onPress={() => onRemove(index)}>
            <Text style={eqStyles.delBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* טקסט שאלה */}
      <View>
        <Text style={eqStyles.label}>טקסט השאלה</Text>
        <TextInput
          style={[eqStyles.input, eqStyles.textarea]}
          value={q.text}
          onChangeText={(v) => updateField('text', v)}
          textAlign="right" textAlignVertical="top"
          multiline maxLength={200}
        />
      </View>

      {/* זמן + נקודות */}
      <View style={eqStyles.metaRow}>
        <View style={{ flex: 1 }}>
          <Text style={eqStyles.label}>זמן (שניות)</Text>
          <TextInput
            style={eqStyles.input}
            value={String(q.time)}
            onChangeText={(v) => updateField('time', v)}
            keyboardType="numeric" textAlign="center"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={eqStyles.label}>נקודות</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {POINTS_OPTIONS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[eqStyles.pointsChip, q.points === p && eqStyles.pointsChipActive]}
                  onPress={() => updateField('points', p)}
                >
                  <Text style={[eqStyles.pointsChipText, q.points === p && eqStyles.pointsChipTextActive]}>
                    {p / 1000}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* תשובות */}
      <View style={eqStyles.answersHead}>
        <Text style={eqStyles.label}>תשובות · סמנו את הנכונה</Text>
        <Text style={eqStyles.answersCount}>{q.answers.length} תשובות</Text>
      </View>

      {q.answers.map((a, aIdx) => {
        const meta = ANSWER_META[aIdx % ANSWER_META.length];
        return (
          <View key={aIdx} style={[eqStyles.answerRow, a.isCorrect && eqStyles.answerRowCorrect]}>
            <View style={[eqStyles.answerLetter, { backgroundColor: meta.color }]}>
              <Text style={[eqStyles.answerLetterText, { color: meta.ink || '#fff' }]}>{meta.letter}</Text>
              <EpShape kind={meta.shape} color={meta.ink || '#fff'} size={12} />
            </View>
            <TextInput
              style={[eqStyles.answerInput, a.isCorrect && eqStyles.answerInputCorrect]}
              value={a.text}
              onChangeText={(v) => updateAnswerText(aIdx, v)}
              placeholder={`תשובה ${aIdx + 1}`}
              placeholderTextColor={colors.inkMute}
              textAlign="right"
            />
            {/* radio */}
            <TouchableOpacity
              style={[eqStyles.radio, a.isCorrect && eqStyles.radioActive]}
              onPress={() => setCorrect(aIdx)}
            >
              <Text style={eqStyles.radioMark}>{a.isCorrect ? '✓' : ''}</Text>
            </TouchableOpacity>
            {/* מחיקת תשובה */}
            <TouchableOpacity
              style={[eqStyles.answerDel, q.answers.length <= 2 && { opacity: 0.3 }]}
              onPress={() => removeAnswer(aIdx)}
              disabled={q.answers.length <= 2}
            >
              <Text style={eqStyles.answerDelText}>✕</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {q.answers.length < 8 && (
        <TouchableOpacity style={eqStyles.addAnswer} onPress={addAnswer}>
          <Text style={eqStyles.addAnswerPlus}>+</Text>
          <Text style={eqStyles.addAnswerText}>הוסף תשובה</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const eqStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper, borderRadius: radii.xl,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    padding: 22, marginBottom: 14, gap: 14,
  },
  headRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
  },
  qNum: {
    fontFamily: fonts.num, fontSize: 12, fontWeight: '700',
    letterSpacing: 0.08, textTransform: 'uppercase', color: colors.inkMute,
  },
  headEnd: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(79,63,245,0.1)',
    borderWidth: 1, borderColor: 'rgba(79,63,245,0.22)',
    borderRadius: radii.pill,
  },
  aiBadgeText: { fontFamily: fonts.num, fontSize: 11, fontWeight: '700', color: colors.primary },
  delBtn: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  delBtnText: { color: colors.ink3, fontWeight: '700', fontSize: 12 },
  label: {
    fontFamily: fonts.body, fontSize: 13, fontWeight: '600',
    color: colors.ink3, textAlign: 'right', marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cream, borderWidth: 2, borderColor: colors.blackAlpha08,
    borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: fonts.display, fontWeight: '600', fontSize: 15, color: colors.ink,
  },
  textarea: { minHeight: 64, paddingTop: 12, fontFamily: fonts.display },
  metaRow: { flexDirection: 'row', gap: 12 },
  pointsChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radii.pill, borderWidth: 1.5,
    borderColor: colors.blackAlpha08, backgroundColor: colors.cream,
  },
  pointsChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  pointsChipText: { fontFamily: fonts.num, fontSize: 12, fontWeight: '700', color: colors.ink3 },
  pointsChipTextActive: { color: colors.paper },
  answersHead: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  answersCount: { fontFamily: fonts.num, fontSize: 12, fontWeight: '600', color: colors.inkMute },
  answerRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 4,
    backgroundColor: colors.cream, borderWidth: 2, borderColor: 'transparent', borderRadius: radii.md,
  },
  answerRowCorrect: { borderColor: colors.ok, backgroundColor: 'rgba(30,158,95,0.06)' },
  answerLetter: {
    width: 44, height: 44, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center', gap: 1,
  },
  answerLetterText: { fontFamily: fonts.display, fontWeight: '800', fontSize: 18, lineHeight: 20 },
  answerInput: {
    flex: 1, backgroundColor: colors.paper, borderWidth: 2,
    borderColor: colors.blackAlpha08, borderRadius: radii.sm,
    paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: fonts.body, fontSize: 14, color: colors.ink,
  },
  answerInputCorrect: { borderColor: colors.ok, backgroundColor: 'rgba(30,158,95,0.06)' },
  radio: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 2, borderColor: 'rgba(20,18,26,0.18)',
    backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.ok, backgroundColor: colors.ok },
  radioMark: { fontWeight: '900', fontSize: 13, color: '#fff' },
  answerDel: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  answerDelText: { color: colors.ink3, fontWeight: '700', fontSize: 12 },
  addAnswer: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.18)',
    borderRadius: radii.pill, borderStyle: 'dashed', alignSelf: 'flex-start',
  },
  addAnswerPlus: { fontFamily: fonts.display, fontWeight: '900', fontSize: 16, color: colors.ink3 },
  addAnswerText: { fontFamily: fonts.body, fontSize: 13.5, fontWeight: '600', color: colors.ink3 },
});

// מסך ראשי
export default function CreateAI() {
  const [topic,        setTopic]        = useState('');
  const [instructions, setInstructions] = useState('');  // ← כמו באתר
  const [numQuestions, setNumQuestions] = useState(5);   // ← ברירת מחדל 5 כמו באתר
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  const [quiz,      setQuiz]      = useState(null);
  const [questions, setQuestions] = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState(false);

  const { token } = useAuth();
  const router    = useRouter();

  const handleGenerate = async () => {
    if (!topic.trim()) { setError('יש להזין נושא'); return; }
    setError('');
    try {
      setLoading(true);
      const res = await axios.post(`${SERVER_URL}/ai/generate-quiz`, {
        topic, instructions, numQuestions,
      });

      setQuiz({
        title:       res.data.title       || topic,
        description: res.data.description || 'AI quiz',
      });

      setQuestions(res.data.questions.map((q) => ({
        text:   q.text,
        type:   'multiple-choice',
        time:   30,
        points: 1000,
        answers: q.options.map((opt, i) => ({
          text:      opt,
          isCorrect: i === q.correctIndex,
        })),
      })));
    } catch {
      setError('בעיה ביצירת החידון. נסו שוב או שנו את הנושא.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (idx, updated) => {
    const copy = [...questions]; copy[idx] = updated; setQuestions(copy);
  };

  const handleRemoveQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, {
      text: '', type: 'multiple-choice', time: 30, points: 1000,
      answers: [
        { text: '', isCorrect: true  },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    }]);
  };

  const handleSave = async () => {
    if (!quiz || questions.length === 0) return;
    try {
      setSaving(true);
      await axios.post(
        `${SERVER_URL}/quizzes`,
        { ...quiz, questions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
      setQuiz(null);
      setQuestions([]);
    } catch (err) {
      Alert.alert('שגיאה', err.response?.data?.message || 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert('לזרוק את הטיוטה?', 'הטיוטה תימחק ותתחיל מחדש.', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'התחל מחדש', style: 'destructive', onPress: () => { setQuiz(null); setQuestions([]); } },
    ]);
  };

  const totalPoints = questions.reduce((s, q) => s + (q.points || 0), 0);
  const totalTime   = questions.reduce((s, q) => s + (q.time   || 0), 0);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Toast */}
      {success && (
        <View style={s.toast} pointerEvents="none">
          <View style={s.toastIcon}><Text style={s.toastIconText}>✓</Text></View>
          <Text style={s.toastText}>החידון נשמר בהצלחה</Text>
        </View>
      )}

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>יצירה עם AI</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {!quiz && (
          <View style={s.formCard}>

            <Text style={s.title}>
              יצירה עם AI{'\n'}
            </Text>
            <Text style={s.sub}>
             בחר נושא והנחיות וה-AI ייצור בשבילך את השאלות. תוכל גם לערוך אחרי זה
            </Text>

            <View style={{ gap: 12, marginTop: 22 }}>
              {/* נושא */}
              <View>
                <Text style={s.label}>נושא החידון</Text>
                <TextInput
                  style={[s.input, s.textarea]}
                  placeholder="לדוגמה: מלחמות העולם, פיזיקה, ספרי בראשית…"
                  placeholderTextColor={colors.inkMute}
                  textAlign="right" textAlignVertical="top"
                  multiline maxLength={500} autoFocus
                  value={topic}
                  onChangeText={(v) => { setTopic(v); if (error) setError(''); }}
                />
                <Text style={s.hint}>ככל שהנושא יותר ספציפי - השאלות יותר מדויקות.</Text>
              </View>

              <View>
                <Text style={s.label}>הנחיות לחידון (אופציונלי)</Text>
                <TextInput
                  style={[s.input, { minHeight: 72 }]}
                  placeholder="לדוגמה: שאלות לכיתה ז', ברמה קשה, עם דגש על תאריכים…"
                  placeholderTextColor={colors.inkMute}
                  textAlign="right" textAlignVertical="top"
                  multiline maxLength={300}
                  value={instructions}
                  onChangeText={setInstructions}
                />
              </View>

              <View>
                <Text style={s.label}>מספר שאלות</Text>
                <View style={s.stepper}>
                  <TouchableOpacity
                    style={s.stepperBtn}
                    onPress={() => setNumQuestions(Math.max(1, numQuestions - 1))}
                  >
                    <Text style={s.stepperBtnText}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={s.stepperInput}
                    value={String(numQuestions)}
                    onChangeText={(v) => { const n = Number(v); if (n >= 1 && n <= 50) setNumQuestions(n); }}
                    keyboardType="numeric" textAlign="center"
                  />
                  <TouchableOpacity
                    style={s.stepperBtn}
                    onPress={() => setNumQuestions(Math.min(50, numQuestions + 1))}
                  >
                    <Text style={s.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {error ? (
                <View style={s.errorBox}>
                  <View style={s.errorIcon}><Text style={s.errorIconText}>!</Text></View>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={[s.generateBtn, loading && { opacity: 0.7 }]}
              onPress={handleGenerate} disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={s.generateBtnText}>ה-AI חושב…</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                  <Text style={s.generateBtnText}>צור חידון</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {quiz && (
          <>
            <View style={s.reviewHead}>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={s.reviewTitle}>{quiz.title}</Text>
                {quiz.description && quiz.description !== 'AI quiz' ? (
                  <Text style={s.reviewDesc}>{quiz.description}</Text>
                ) : null}
              </View>
              <View style={s.reviewActions}>
                <TouchableOpacity style={s.ghostBtn} onPress={handleReset}>
                  <Text style={s.ghostBtnText}> התחל מחדש</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.primaryBtn, (saving || questions.length === 0) && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving || questions.length === 0}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.primaryBtnText}>שמור חידון</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* סטטיסטיקות */}
            <View style={s.stats}>
              {[
                { label: 'שאלות',          value: String(questions.length)      },
                { label: 'סה"כ נקודות',    value: totalPoints.toLocaleString()  },
                { label: 'משך משוער',       value: `${Math.ceil(totalTime / 60)} דק'` },
              ].map((item, i) => (
                <View key={i} style={[s.statItem, i === 0 && { borderRightWidth: 0 }]}>
                  <Text style={s.statValue}>{item.value}</Text>
                  <Text style={s.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* שאלות editable */}
            {questions.map((q, i) => (
              <EditableQuestion
                key={i}
                q={q}
                index={i}
                onChange={handleQuestionChange}
                onRemove={handleRemoveQuestion}
              />
            ))}

            <TouchableOpacity style={s.addQuestionBtn} onPress={handleAddQuestion}>
              <Text style={s.addQuestionBtnPlus}>+</Text>
              <Text style={s.addQuestionBtnText}>הוסף שאלה</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  toast: {
    position: 'absolute', top: 80, alignSelf: 'center', zIndex: 100,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 22,
    backgroundColor: colors.ok, borderRadius: radii.pill,
    shadowColor: 'rgba(30,158,95,0.3)', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1, shadowRadius: 24, elevation: 10,
  },
  toastIcon: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  toastIconText: { color: '#fff', fontWeight: '900' },
  toastText: { color: '#fff', fontFamily: fonts.display, fontWeight: '700', fontSize: 15 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: colors.cream,
    borderBottomWidth: 1, borderBottomColor: 'rgba(20,18,26,0.06)',
  },
  headerTitle: { fontFamily: fonts.display, fontWeight: '800', fontSize: 18, color: colors.ink },

  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },

  formCard: {
    backgroundColor: colors.paper, borderRadius: radii.xl,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    padding: 26, maxWidth: 640, width: '100%', alignSelf: 'center',
    shadowColor: colors.ink, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06, shadowRadius: 32, elevation: 6,
  },
  art: {
    height: 72, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, position: 'relative',
  },
  artBlur: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.ans1, opacity: 0.1,
  },
  kicker: {
    fontFamily: fonts.num, fontSize: 12, fontWeight: '600',
    letterSpacing: 0.04, color: colors.inkMute,
    textAlign: 'right', marginBottom: 6,
  },
  title: {
    fontFamily: fonts.display, fontWeight: '800', fontSize: 36,
    letterSpacing: -0.03, lineHeight: 38, color: colors.ink, textAlign: 'right',
  },
  sub: {
    fontFamily: fonts.body, fontSize: 14, lineHeight: 21,
    color: colors.ink3, textAlign: 'right', marginTop: 6,
  },
  label: {
    fontFamily: fonts.body, fontSize: 13, fontWeight: '600',
    color: colors.ink3, textAlign: 'right', marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cream, borderWidth: 2,
    borderColor: colors.blackAlpha08, borderRadius: radii.md,
    paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: fonts.body, fontSize: 15, color: colors.ink,
  },
  textarea: { minHeight: 80, paddingTop: 14 },
  hint: { fontSize: 12, color: colors.inkMute, textAlign: 'right', marginTop: 4 },

  stepper: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: colors.paper,
    borderWidth: 2, borderColor: colors.blackAlpha08,
    borderRadius: radii.md, overflow: 'hidden', height: 50,
  },
  stepperBtn: {
    width: 44, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  stepperBtnText: { fontFamily: fonts.display, fontWeight: '900', fontSize: 22, color: colors.ink3 },
  stepperInput: {
    flex: 1, textAlign: 'center',
    fontFamily: fonts.num, fontWeight: '700', fontSize: 20, color: colors.ink,
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.blackAlpha08,
  },

  errorBox: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: 'rgba(214,58,45,0.08)',
    borderWidth: 1, borderColor: 'rgba(214,58,45,0.25)', borderRadius: radii.sm,
  },
  errorIcon: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.bad, alignItems: 'center', justifyContent: 'center',
  },
  errorIconText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  errorText: { color: colors.bad, fontSize: 14, flex: 1, textAlign: 'right' },

  generateBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: 20, paddingVertical: 17,
    backgroundColor: colors.primary, borderRadius: radii.pill,
    shadowColor: colors.primaryDeep, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 6,
  },
  generateBtnSpark: { color: colors.ans3, fontWeight: '900', fontSize: 16 },
  generateBtnText: { fontFamily: fonts.display, fontSize: 17, fontWeight: '700', color: '#fff' },

  reviewHead: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'flex-end', gap: 16, marginBottom: 20,
  },
  reviewTitle: {
    fontFamily: fonts.display, fontWeight: '800', fontSize: 28,
    letterSpacing: -0.025, color: colors.ink, textAlign: 'right',
  },
  reviewDesc: { fontSize: 14.5, color: colors.ink3, textAlign: 'right', marginTop: 4 },
  reviewActions: { flexDirection: 'row', gap: 8, flexShrink: 0 },
  ghostBtn: {
    paddingVertical: 11, paddingHorizontal: 16, borderRadius: radii.pill,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.12)',
  },
  ghostBtnText: { fontFamily: fonts.body, fontWeight: '700', fontSize: 14, color: colors.ink3 },
  primaryBtn: {
    paddingVertical: 11, paddingHorizontal: 18, borderRadius: radii.pill,
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDeep, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  primaryBtnText: { fontFamily: fonts.display, fontWeight: '700', fontSize: 14, color: '#fff' },

  stats: {
    flexDirection: 'row', backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    borderRadius: radii.lg, overflow: 'hidden', marginBottom: 20,
  },
  statItem: {
    flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14,
    borderRightWidth: 1, borderRightColor: 'rgba(20,18,26,0.08)',
  },
  statValue: { fontFamily: fonts.display, fontWeight: '800', fontSize: 22, color: colors.ink, lineHeight: 24 },
  statLabel: {
    fontFamily: fonts.num, fontSize: 11, fontWeight: '500',
    color: colors.inkMute, textTransform: 'uppercase',
  },

  addQuestionBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8, width: '100%', paddingVertical: 16,
    borderWidth: 2, borderColor: 'rgba(20,18,26,0.18)',
    borderRadius: radii.lg, borderStyle: 'dashed', marginTop: 4,
  },
  addQuestionBtnPlus: { fontFamily: fonts.display, fontWeight: '900', fontSize: 20, color: colors.ink3 },
  addQuestionBtnText: { fontFamily: fonts.display, fontWeight: '700', fontSize: 15, color: colors.ink3 },
});