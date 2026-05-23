// ===================================================================
// app/main/create-ai.js — EduPlay design
// תואם 1:1 ל-AICreateQuiz.jsx של האתר:
// - עיצוב: cream/paper, ink text, primary buttons
// - לוגיקה: שאלות editable אחרי generate (textarea, זמן/נקודות, radio)
// ===================================================================
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { SERVER_URL } from '../../utils/socket';
import { colors, fonts, radii } from '../../constants/theme';
import { EpShape } from '../../components/EpBrand';
import { Ionicons } from '@expo/vector-icons';

const DIFFICULTIES = [
  { label: 'קל',    value: 'easy'   },
  { label: 'בינוני', value: 'medium' },
  { label: 'קשה',   value: 'hard'   },
];
const NUM_OPTIONS = [5, 10, 15, 20];

/* ─────────────────────────────────────────────────────────
   EditableQuestion — שאלה ניתנת לעריכה אחרי generate
   מקביל ל-.question-card ב-AICreateQuiz.jsx של האתר
───────────────────────────────────────────────────────── */
function EditableQuestion({ q, index, onChange }) {
  const COLORS = [colors.ans1, colors.ans2, colors.ans3, colors.ans4];

  const updateField = (field, value) => {
    onChange(index, { ...q, [field]: field === 'text' ? value : Number(value) });
  };

  const updateAnswerText = (aIndex, value) => {
    const updated = [...q.answers];
    updated[aIndex] = { ...updated[aIndex], text: value };
    onChange(index, { ...q, answers: updated });
  };

  const setCorrect = (aIndex) => {
    const updated = q.answers.map((a, i) => ({ ...a, isCorrect: i === aIndex }));
    onChange(index, { ...q, answers: updated });
  };

  return (
    <View style={eqStyles.card}>
      {/* מספר שאלה */}
      <View style={eqStyles.numRow}>
        <View style={[eqStyles.numBadge, { backgroundColor: COLORS[index % 4] }]}>
          <Text style={eqStyles.numText}>{index + 1}</Text>
        </View>
        <Text style={eqStyles.numLabel}>שאלה {index + 1}</Text>
      </View>

      {/* טקסט שאלה — editable */}
      <Text style={eqStyles.label}>טקסט השאלה</Text>
      <TextInput
        style={[eqStyles.input, eqStyles.textarea]}
        value={q.text}
        onChangeText={(v) => updateField('text', v)}
        textAlign="right"
        textAlignVertical="top"
        multiline
      />

      {/* זמן + נקודות */}
      <View style={eqStyles.metaRow}>
        <View style={{ flex: 1 }}>
          <Text style={eqStyles.label}>שניות</Text>
          <TextInput
            style={eqStyles.input}
            value={String(q.time)}
            onChangeText={(v) => updateField('time', v)}
            keyboardType="numeric"
            textAlign="center"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={eqStyles.label}>נקודות</Text>
          <TextInput
            style={eqStyles.input}
            value={String(q.points)}
            onChangeText={(v) => updateField('points', v)}
            keyboardType="numeric"
            textAlign="center"
          />
        </View>
      </View>

      {/* תשובות — editable + radio */}
      <Text style={[eqStyles.label, { marginBottom: 10 }]}>תשובות</Text>
      {q.answers.map((a, aIndex) => (
        <View key={aIndex} style={eqStyles.answerRow}>
          <View style={[eqStyles.answerDot, { backgroundColor: COLORS[aIndex % 4] }]} />

          <TextInput
            style={[eqStyles.answerInput, a.isCorrect && eqStyles.answerCorrect]}
            value={a.text}
            onChangeText={(v) => updateAnswerText(aIndex, v)}
            textAlign="right"
          />

          {/* radio — סמן כנכונה */}
          <TouchableOpacity
            style={[eqStyles.radio, a.isCorrect && eqStyles.radioActive]}
            onPress={() => setCorrect(aIndex)}
          >
            {a.isCorrect && <View style={eqStyles.radioDot} />}
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const eqStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(20,18,26,0.06)',
    padding: 18,
    marginBottom: 14,
  },
  numRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  numBadge: {
    width: 28, height: 28, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  numText: {
    fontFamily: fonts.num, fontWeight: '700',
    fontSize: 13, color: '#fff',
  },
  numLabel: {
    fontFamily: fonts.display, fontWeight: '700',
    fontSize: 14, color: colors.ink,
  },
  label: {
    fontFamily: fonts.body, fontSize: 12, fontWeight: '600',
    color: colors.ink3, textAlign: 'right', marginBottom: 6,
  },
  input: {
    backgroundColor: colors.cream,
    borderWidth: 2, borderColor: colors.blackAlpha08,
    borderRadius: radii.sm,
    paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: fonts.body, fontSize: 14,
    color: colors.ink,
    marginBottom: 12,
  },
  textarea: { minHeight: 72, paddingTop: 10 },
  metaRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },

  answerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  answerDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  answerInput: {
    flex: 1,
    backgroundColor: colors.cream,
    borderWidth: 2, borderColor: colors.blackAlpha08,
    borderRadius: radii.sm,
    paddingHorizontal: 12, paddingVertical: 9,
    fontFamily: fonts.body, fontSize: 13,
    color: colors.ink,
  },
  answerCorrect: {
    borderColor: colors.ok,
    backgroundColor: 'rgba(30,158,95,0.07)',
  },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.blackAlpha16,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.ok, backgroundColor: 'rgba(30,158,95,0.1)' },
  radioDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.ok,
  },
});

/* ─────────────────────────────────────────────────────────
   מסך ראשי — CreateAI
───────────────────────────────────────────────────────── */
export default function CreateAI() {
  const [topic,       setTopic]       = useState('');
  const [difficulty,  setDifficulty]  = useState('medium');
  const [numQuestions,setNumQuestions]= useState(10);
  const [generating,  setGenerating]  = useState(false);
  const [saving,      setSaving]      = useState(false);

  const [quiz,      setQuiz]      = useState(null);   // { title, description }
  const [questions, setQuestions] = useState([]);     // editable

  const { token } = useAuth();
  const router    = useRouter();

  /* ── Generate ── */
  const handleGenerate = async () => {
    if (!topic.trim()) return Alert.alert('שגיאה', 'אנא הכניסו נושא לשאלון');
    try {
      setGenerating(true);
      setQuiz(null);
      setQuestions([]);

      const res = await axios.post(`${SERVER_URL}/ai/generate-quiz`, {
        topic, difficulty, numQuestions,
      });

      // המרה לפורמט editable — זהה ל-AICreateQuiz.jsx באתר
      const generated = res.data.questions.map((q) => ({
        text:   q.text,
        type:   'multiple-choice',
        time:   30,
        points: 1,
        answers: q.options.map((opt, i) => ({
          text:      opt,
          isCorrect: i === q.correctIndex,
        })),
      }));

      setQuiz({
        title:       res.data.title       || topic,
        description: res.data.description || 'AI quiz',
      });
      setQuestions(generated);

    } catch {
      Alert.alert('שגיאה', 'שגיאה ביצירת השאלון עם AI');
    } finally {
      setGenerating(false);
    }
  };

  /* ── עדכון שאלה בודדת (מה-EditableQuestion) ── */
  const handleQuestionChange = (index, updated) => {
    const copy = [...questions];
    copy[index] = updated;
    setQuestions(copy);
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!quiz || questions.length === 0)
      return Alert.alert('שגיאה', 'אין שאלות לשמירה');
    try {
      setSaving(true);
      await axios.post(
        `${SERVER_URL}/quizzes`,
        { ...quiz, questions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('✅ הצלחה', 'החידון נשמר בהצלחה', [
        { text: 'אישור', onPress: () => router.replace('/main/my-quizzes') },
      ]);
    } catch (err) {
      Alert.alert('שגיאה', err.response?.data?.message || 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={aiStyles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={aiStyles.headerTitle}>יצירה עם AI ✨</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={aiStyles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ══ טופס הגדרות ══ */}
        <View style={aiStyles.settingsCard}>
          {/* art */}
          <View style={aiStyles.art}>
            <View style={aiStyles.artBlur} />
            <EpShape kind="burst" color={colors.ans1} size={52} />
          </View>

          <Text style={aiStyles.kicker}>יצירה חכמה</Text>
          <Text style={aiStyles.title}>יצרו חידון עם AI</Text>
          <Text style={aiStyles.sub}>
            בחרו נושא ורמת קושי — הבינה המלאכותית תייצר טיוטה,
            ואתם תוכלו לערוך לפני השמירה.
          </Text>

          <View style={{ gap: 16, marginTop: 22 }}>
            {/* נושא */}
            <View>
              <Text style={aiStyles.label}>נושא החידון</Text>
              <TextInput
                style={[aiStyles.input, aiStyles.textarea]}
                placeholder="לדוגמה: היסטוריה של ישראל, כדורגל, מדע…"
                placeholderTextColor={colors.inkMute}
                textAlign="right"
                textAlignVertical="top"
                multiline
                value={topic}
                onChangeText={setTopic}
              />
            </View>

            {/* רמת קושי */}
            <View>
              <Text style={aiStyles.label}>רמת קושי</Text>
              <View style={aiStyles.pills}>
                {DIFFICULTIES.map((d) => (
                  <TouchableOpacity
                    key={d.value}
                    style={[aiStyles.pill, difficulty === d.value && aiStyles.pillActive]}
                    onPress={() => setDifficulty(d.value)}
                  >
                    <Text style={[aiStyles.pillText, difficulty === d.value && aiStyles.pillTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* מספר שאלות */}
            <View>
              <Text style={aiStyles.label}>מספר שאלות</Text>
              <View style={aiStyles.pills}>
                {NUM_OPTIONS.map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[aiStyles.pill, numQuestions === n && aiStyles.pillActive]}
                    onPress={() => setNumQuestions(n)}
                  >
                    <Text style={[aiStyles.pillText, numQuestions === n && aiStyles.pillTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Generate button */}
          <TouchableOpacity
            style={[aiStyles.generateBtn, generating && aiStyles.btnDisabled]}
            onPress={handleGenerate}
            disabled={generating}
            activeOpacity={0.85}
          >
            {generating ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={aiStyles.generateBtnText}>יוצר שאלון…</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                <Ionicons name="sparkles-outline" size={18} color="#fff" />
                <Text style={aiStyles.generateBtnText}>צור שאלון</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ══ שאלות editable (אחרי generate) ══ */}
        {quiz && questions.length > 0 && (
          <>
            {/* כותרת חידון */}
            <View style={aiStyles.quizHeader}>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={aiStyles.quizTitle}>{quiz.title}</Text>
                <Text style={aiStyles.quizMeta}>
                  {questions.length} שאלות · ניתנות לעריכה
                </Text>
              </View>
              {/* צור מחדש */}
              <TouchableOpacity
                style={aiStyles.regenBtn}
                onPress={handleGenerate}
                disabled={generating}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.ink3} />
                <Text style={aiStyles.regenText}>מחדש</Text>
              </TouchableOpacity>
            </View>

            {/* שאלות editable */}
            {questions.map((q, i) => (
              <EditableQuestion
                key={i}
                q={q}
                index={i}
                onChange={handleQuestionChange}
              />
            ))}

            {/* שמור */}
            <TouchableOpacity
              style={[aiStyles.saveBtn, saving && aiStyles.btnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Text style={aiStyles.saveBtnText}>שמור חידון</Text>
                    <Text style={aiStyles.saveBtnArrow}>←</Text>
                  </>
              }
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const aiStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(20,18,26,0.06)',
  },
  headerTitle: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 18, color: colors.ink,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },

  // Settings card
  settingsCard: {
    backgroundColor: colors.paper,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(20,18,26,0.06)',
    padding: 24,
    marginBottom: 16,
  },
  art: {
    height: 72, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, position: 'relative',
  },
  artBlur: {
    position: 'absolute',
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.ans1, opacity: 0.1,
  },
  kicker: {
    fontFamily: fonts.num, fontSize: 11, fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.inkMute, textAlign: 'right', marginBottom: 6,
  },
  title: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 26, letterSpacing: -0.6,
    color: colors.ink, textAlign: 'right',
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
    backgroundColor: colors.cream,
    borderWidth: 2, borderColor: colors.blackAlpha08,
    borderRadius: radii.md,
    paddingHorizontal: 16, paddingVertical: 13,
    fontFamily: fonts.body, fontSize: 15,
    color: colors.ink,
  },
  textarea: { minHeight: 76, paddingTop: 12 },

  // Pills
  pills: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  pill: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.blackAlpha08,
    backgroundColor: colors.cream,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontFamily: fonts.body, fontSize: 13, fontWeight: '600',
    color: colors.ink3,
  },
  pillTextActive: { color: '#fff' },

  // Generate button — violet burst
  generateBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    backgroundColor: colors.ans2,   // violet — כמו כפתור AI באתר
    paddingVertical: 16,
    borderRadius: radii.pill,
    shadowColor: colors.ans2Ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 0,
    elevation: 5,
  },
  generateBtnText: {
    fontFamily: fonts.display, fontSize: 16, fontWeight: '700',
    color: '#fff',
  },
  btnDisabled: { opacity: 0.6 },

  // Quiz header after generate
  quizHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(20,18,26,0.06)',
    padding: 16,
    marginBottom: 14,
  },
  quizTitle: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 18, color: colors.ink, textAlign: 'right',
  },
  quizMeta: {
    fontFamily: fonts.num, fontSize: 11,
    color: colors.inkMute, marginTop: 2,
  },
  regenBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: colors.blackAlpha16,
    borderRadius: radii.pill,
  },
  regenText: {
    fontFamily: fonts.body, fontSize: 12, fontWeight: '600',
    color: colors.ink3,
  },

  // Save button
  saveBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 17,
    borderRadius: radii.pill,
    marginTop: 4,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1, shadowRadius: 0,
    elevation: 6,
  },
  saveBtnText: {
    color: '#fff', fontFamily: fonts.display,
    fontSize: 17, fontWeight: '700',
  },
  saveBtnArrow: { color: '#fff', fontSize: 20 },
});