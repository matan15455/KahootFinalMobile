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

function QuizForm({ onNext }) {
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [error, setError]             = useState('');

  const handleNext = () => {
    if (!title.trim()) return setError('נא להזין שם לחידון');
    onNext({ title, description });
  };

  return (
    <View style={qfStyles.card}>
      

      <Text style={qfStyles.title}>יצירה ידנית</Text>
      <Text style={qfStyles.sub}>
       הכנס שם חידון ותיאור (אופציונלי) ואז נעבור לשאלות
      </Text>

      <View style={{ gap: 14, marginTop: 22 }}>
        <View>
          <Text style={qfStyles.label}>שם החידון</Text>
          <TextInput
            style={qfStyles.input}
            placeholder="לדוגמה: היסטוריה של המאה ה-20"
            placeholderTextColor={colors.inkMute}
            textAlign="right" maxLength={80}
            value={title}
            onChangeText={(v) => { setTitle(v); if (error) setError(''); }}
            autoFocus
          />
        </View>
        <View>
          <Text style={qfStyles.label}>תיאור (אופציונלי)</Text>
          <TextInput
            style={[qfStyles.input, qfStyles.textarea]}
            placeholder="מה התלמידים ילמדו? למי הוא מיועד?"
            placeholderTextColor={colors.inkMute}
            textAlign="right" textAlignVertical="top"
            multiline numberOfLines={4} maxLength={300}
            value={description}
            onChangeText={setDescription}
          />
          <Text style={qfStyles.hint}>{description.length}/300</Text>
        </View>

        {error ? (
          <View style={shared.errorBox}>
            <View style={shared.errorIcon}><Text style={shared.errorIconText}>!</Text></View>
            <Text style={shared.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={qfStyles.submit} activeOpacity={0.85} onPress={handleNext}>
        <Text style={qfStyles.submitText}>המשך ליצירת שאלות</Text>
      </TouchableOpacity>
    </View>
  );
}

const qfStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderRadius: radii.xl, borderWidth: 1,
    borderColor: 'rgba(20,18,26,0.06)', padding: 26,
    maxWidth: 640, width: '100%', alignSelf: 'center',
    shadowColor: colors.ink, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06, shadowRadius: 32, elevation: 6,
  },
  art: {
    height: 72, alignItems: 'center', justifyContent: 'center',
    marginBottom: 10, position: 'relative',
  },
  artBlur: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.ans2, opacity: 0.1,
  },
  kicker: {
    fontFamily: fonts.num, fontSize: 11, fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.inkMute, textAlign: 'right', marginBottom: 6,
  },
  title: {
    fontFamily: fonts.display, fontWeight: '800', fontSize: 28,
    letterSpacing: -0.6, color: colors.ink, textAlign: 'right',
  },
  sub: {
    fontFamily: fonts.body, fontSize: 14, lineHeight: 21,
    color: colors.ink3, textAlign: 'right', marginTop: 6, marginBottom: 0,
  },
  label: {
    fontFamily: fonts.body, fontSize: 13, fontWeight: '600',
    color: colors.ink3, marginBottom: 8, textAlign: 'right',
  },
  input: {
    backgroundColor: colors.cream, borderWidth: 2,
    borderColor: colors.blackAlpha08, borderRadius: radii.md,
    paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: fonts.body, fontSize: 15, color: colors.ink,
  },
  textarea: { minHeight: 88, paddingTop: 14 },
  hint: { fontSize: 12, color: colors.inkMute, textAlign: 'right', marginTop: 4 },
  submit: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: 22,
    backgroundColor: colors.primary, paddingVertical: 16,
    borderRadius: radii.pill,
    shadowColor: colors.primaryDeep, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  submitText: { color: '#fff', fontFamily: fonts.display, fontSize: 16, fontWeight: '700' },
  submitArrow: { color: '#fff', fontSize: 20 },
});


const shared = StyleSheet.create({
  errorBox: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: 'rgba(214,58,45,0.08)',
    borderWidth: 1, borderColor: 'rgba(214,58,45,0.25)',
    borderRadius: radii.sm,
  },
  errorIcon: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.bad, alignItems: 'center', justifyContent: 'center',
  },
  errorIconText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  errorText: { color: colors.bad, fontSize: 14, flex: 1, textAlign: 'right' },
});


function QuestionForm({ onAdd, onCancel, index = 0 }) {
  const [text,    setText]    = useState('');
  const [time,    setTime]    = useState(30);
  const [points,  setPoints]  = useState(1000);
  const [answers, setAnswers] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [error, setError] = useState('');

  const updateText   = (i, v) => { const u = [...answers]; u[i] = { ...u[i], text: v }; setAnswers(u); };
  const setCorrect   = (i)    => setAnswers(answers.map((a, j) => ({ ...a, isCorrect: j === i })));
  const addAnswer    = ()     => { if (answers.length >= 8) return; setAnswers([...answers, { text: '', isCorrect: false }]); };
  const removeAnswer = (i)    => { if (answers.length <= 2) return; setAnswers(answers.filter((_, j) => j !== i)); };

  const handleAdd = () => {
    if (!text.trim())                       return setError('נא להזין טקסט שאלה');
    if (answers.some(a => !a.text.trim()))  return setError('כל התשובות חייבות להכיל טקסט');
    if (!answers.some(a => a.isCorrect))    return setError('יש לבחור תשובה נכונה אחת');
    onAdd({ text, type: 'multiple-choice', time, points, answers });
  };

  return (
    <View style={aqStyles.card}>
      <View style={aqStyles.headRow}>
        <View>
          <Text style={aqStyles.kicker}>שאלה {String(index + 1).padStart(2, '0')}</Text>
          <Text style={aqStyles.heading}>פרטי השאלה</Text>
        </View>
        <TouchableOpacity style={aqStyles.closeBtn} onPress={onCancel}>
          <Text style={aqStyles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* טקסט */}
      <View>
        <Text style={aqStyles.label}>טקסט השאלה</Text>
        <TextInput
          style={[aqStyles.input, aqStyles.textarea]}
          placeholder="מה השאלה?"
          placeholderTextColor={colors.inkMute}
          textAlign="right" textAlignVertical="top"
          multiline autoFocus maxLength={200}
          value={text}
          onChangeText={(v) => { setText(v); if (error) setError(''); }}
        />
      </View>

      {/* זמן + נקודות */}
      <View style={aqStyles.metaRow}>
        <View style={{ flex: 1 }}>
          <Text style={aqStyles.label}>זמן (שניות)</Text>
          <TextInput
            style={aqStyles.input}
            value={String(time)}
            onChangeText={(v) => { const n = Number(v); if (n >= 1) setTime(n); }}
            keyboardType="numeric" textAlign="center"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={aqStyles.label}>נקודות</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {POINTS_OPTIONS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[aqStyles.pointsChip, points === p && aqStyles.pointsChipActive]}
                  onPress={() => setPoints(p)}
                >
                  <Text style={[aqStyles.pointsChipText, points === p && aqStyles.pointsChipTextActive]}>
                    {(p / 1000)}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* תשובות */}
      <View style={aqStyles.answersHead}>
        <Text style={aqStyles.label}>תשובות · בחרו את הנכונה</Text>
        <Text style={aqStyles.answersCount}>{answers.length} תשובות</Text>
      </View>

      {answers.map((a, i) => {
        const meta = ANSWER_META[i % ANSWER_META.length];
        return (
          <View key={i} style={[aqStyles.answerRow, a.isCorrect && aqStyles.answerRowCorrect]}>
            <View style={[aqStyles.answerLetter, { backgroundColor: meta.color }]}>
              <Text style={[aqStyles.answerLetterText, { color: meta.ink || '#fff' }]}>{meta.letter}</Text>
              <EpShape kind={meta.shape} color={meta.ink || '#fff'} size={12} />
            </View>
            <TextInput
              style={[aqStyles.answerInput, a.isCorrect && aqStyles.answerInputCorrect]}
              placeholder={`תשובה ${i + 1}`}
              placeholderTextColor={colors.inkMute}
              textAlign="right" maxLength={100}
              value={a.text}
              onChangeText={(v) => updateText(i, v)}
            />
            <TouchableOpacity
              style={[aqStyles.radio, a.isCorrect && aqStyles.radioActive]}
              onPress={() => setCorrect(i)}
            >
              <Text style={aqStyles.radioMark}>{a.isCorrect ? '✓' : ''}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[aqStyles.delBtn, answers.length <= 2 && { opacity: 0.3 }]}
              onPress={() => removeAnswer(i)}
              disabled={answers.length <= 2}
            >
              <Text style={aqStyles.delBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      {answers.length < 8 && (
        <TouchableOpacity style={aqStyles.addAnswer} onPress={addAnswer}>
          <Text style={aqStyles.addAnswerPlus}>+</Text>
          <Text style={aqStyles.addAnswerText}>הוסף תשובה</Text>
        </TouchableOpacity>
      )}

      {error ? (
        <View style={shared.errorBox}>
          <View style={shared.errorIcon}><Text style={shared.errorIconText}>!</Text></View>
          <Text style={shared.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={aqStyles.btns}>
        <TouchableOpacity style={aqStyles.cancel} onPress={onCancel}>
          <Text style={aqStyles.cancelText}>בטל</Text>
        </TouchableOpacity>
        <TouchableOpacity style={aqStyles.confirm} onPress={handleAdd}>
          <Text style={aqStyles.confirmText}>שמור שאלה</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const aqStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper, borderRadius: radii.xl,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    padding: 22, marginBottom: 14,
    shadowColor: colors.ink, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08, shadowRadius: 32, elevation: 5,
    gap: 14,
  },
  headRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 4,
  },
  kicker: {
    fontFamily: fonts.num, fontSize: 11, fontWeight: '600',
    letterSpacing: 0.08, textTransform: 'uppercase', color: colors.inkMute, textAlign: 'right',
  },
  heading: {
    fontFamily: fonts.display, fontWeight: '700', fontSize: 20,
    color: colors.ink, textAlign: 'right', marginTop: 4,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: colors.ink3, fontWeight: '700', fontSize: 12 },
  label: {
    fontFamily: fonts.body, fontSize: 13, fontWeight: '600',
    color: colors.ink3, textAlign: 'right', marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cream, borderWidth: 2, borderColor: colors.blackAlpha08,
    borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: fonts.body, fontSize: 15, color: colors.ink,
  },
  textarea: { minHeight: 76, paddingTop: 12 },
  metaRow: { flexDirection: 'row', gap: 12 },
  pointsChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radii.pill, borderWidth: 1.5,
    borderColor: colors.blackAlpha08, backgroundColor: colors.cream,
  },
  pointsChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  pointsChipText: { fontFamily: fonts.num, fontSize: 12, fontWeight: '700', color: colors.ink3 },
  pointsChipTextActive: { color: colors.paper },
  answersHead: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center',
  },
  answersCount: { fontFamily: fonts.num, fontSize: 12, fontWeight: '600', color: colors.inkMute },
  answerRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    padding: 6, backgroundColor: colors.cream,
    borderWidth: 2, borderColor: 'transparent', borderRadius: radii.md,
  },
  answerRowCorrect: { borderColor: colors.ok, backgroundColor: 'rgba(30,158,95,0.06)' },
  answerLetter: {
    width: 56, height: 44, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center', gap: 1,
  },
  answerLetterText: { fontFamily: fonts.display, fontWeight: '800', fontSize: 20, lineHeight: 22 },
  answerInput: {
    flex: 1, backgroundColor: colors.paper,
    borderWidth: 2, borderColor: colors.blackAlpha08,
    borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: fonts.body, fontSize: 14, color: colors.ink,
  },
  answerInputCorrect: { borderColor: colors.ok, backgroundColor: 'rgba(30,158,95,0.06)' },
  radio: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: 'rgba(20,18,26,0.18)',
    backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.ok, backgroundColor: colors.ok },
  radioMark: { fontWeight: '900', fontSize: 14, color: '#fff' },
  delBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  delBtnText: { color: colors.ink3, fontWeight: '700', fontSize: 12 },
  addAnswer: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.18)',
    borderRadius: radii.pill, borderStyle: 'dashed', alignSelf: 'flex-start',
  },
  addAnswerPlus: { fontFamily: fonts.display, fontWeight: '900', fontSize: 16, color: colors.ink3 },
  addAnswerText: { fontFamily: fonts.body, fontSize: 13.5, fontWeight: '600', color: colors.ink3 },
  btns: {
    flexDirection: 'row', gap: 10,
    marginTop: 6, paddingTop: 18,
    borderTopWidth: 1, borderTopColor: 'rgba(20,18,26,0.06)',
  },
  cancel: {
    paddingVertical: 12, paddingHorizontal: 22,
    borderRadius: radii.pill, borderWidth: 1, borderColor: 'rgba(20,18,26,0.12)',
  },
  cancelText: { fontFamily: fonts.display, fontSize: 14.5, fontWeight: '700', color: colors.ink3 },
  confirm: {
    flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radii.pill,
    backgroundColor: colors.ink,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  confirmText: { fontFamily: fonts.display, fontSize: 14.5, fontWeight: '700', color: colors.paper },
});

// מסך ראשי
export default function CreateManual() {
  const [quiz,           setQuiz]           = useState(null);
  const [questions,      setQuestions]      = useState([]);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [success,        setSuccess]        = useState(false);

  const { token } = useAuth();
  const router    = useRouter();

  const handleAddQuestion = (q) => { setQuestions([...questions, q]); setAddingQuestion(false); };

  const handleSave = async () => {
    if (questions.length === 0) return Alert.alert('שגיאה', 'הוסיפו לפחות שאלה אחת');
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

  const totalPoints = questions.reduce((s, q) => s + (q.points || 0), 0);
  const totalTime   = questions.reduce((s, q) => s + (q.time || 0), 0);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {success && (
        <View style={mainStyles.toast} pointerEvents="none">
          <View style={mainStyles.toastIcon}><Text style={mainStyles.toastIconText}>✓</Text></View>
          <Text style={mainStyles.toastText}>החידון נשמר בהצלחה</Text>
        </View>
      )}

      <View style={mainStyles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={mainStyles.headerTitle}>יצירה ידנית</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={mainStyles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!quiz && <QuizForm onNext={setQuiz} />}

        {quiz && (
          <>
            <View style={mainStyles.quizHead}>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={mainStyles.quizTitle}>{quiz.title}</Text>
                {quiz.description ? <Text style={mainStyles.quizDesc}>{quiz.description}</Text> : null}
              </View>
              <View style={mainStyles.quizActions}>
                <TouchableOpacity
                  style={mainStyles.ghostBtn}
                  onPress={() => {
                    if (questions.length > 0) {
                      Alert.alert('לעזוב?', 'השאלות לא נשמרו.', [
                        { text: 'ביטול', style: 'cancel' },
                        { text: 'עזוב', style: 'destructive', onPress: () => { setQuiz(null); setQuestions([]); } },
                      ]);
                    } else { setQuiz(null); }
                  }}
                >
                  <Text style={mainStyles.ghostBtnText}> חזור</Text>
                </TouchableOpacity>
                {!addingQuestion && questions.length > 0 && (
                  <TouchableOpacity
                    style={[mainStyles.primaryBtn, saving && { opacity: 0.6 }]}
                    onPress={handleSave} disabled={saving || questions.length === 0}
                  >
                    {saving
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={mainStyles.primaryBtnText}>שמור חידון</Text>
                    }
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* סטטיסטיקות */}
            <View style={mainStyles.stats}>
              {[
                { label: 'שאלות', value: String(questions.length) },
                { label: 'סה"כ נקודות', value: totalPoints.toLocaleString() },
                { label: 'משך משוער', value: `${Math.ceil(totalTime / 60)} דק'` },
              ].map((s, i) => (
                <View key={i} style={[mainStyles.statItem, i === 0 && { borderRightWidth: 0 }]}>
                  <Text style={mainStyles.statValue}>{s.value}</Text>
                  <Text style={mainStyles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Empty */}
            {questions.length === 0 && !addingQuestion && (
              <View style={mainStyles.empty}>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
                  {ANSWER_META.slice(0, 4).map((m, i) => (
                    <EpShape key={i} kind={m.shape} color={m.color} size={32} />
                  ))}
                </View>
                <TouchableOpacity style={mainStyles.primaryBtnLg} onPress={() => setAddingQuestion(true)}>
                  <Text style={mainStyles.primaryBtnLgPlus}>+</Text>
                  <Text style={mainStyles.primaryBtnLgText}>שאלה ראשונה</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* רשימת שאלות */}
            {questions.length > 0 && (
              <View style={{ gap: 10, marginBottom: 14 }}>
                {questions.map((q, i) => {
                  const correct = q.answers.find(a => a.isCorrect);
                  return (
                    <View key={i} style={mainStyles.qitem}>
                      <Text style={mainStyles.qitemNum}>{String(i + 1).padStart(2, '0')}</Text>
                      <View style={mainStyles.qitemBody}>
                        <Text style={mainStyles.qitemText} numberOfLines={2}>{q.text}</Text>
                        <View style={mainStyles.qitemMeta}>
                          <View style={mainStyles.chip}><Text style={mainStyles.chipText}>{q.points?.toLocaleString()} נקודות</Text></View>
                          <View style={mainStyles.chip}><Text style={mainStyles.chipText}>{q.time} שניות</Text></View>
                          <View style={mainStyles.chip}><Text style={mainStyles.chipText}>{q.answers.length} תשובות</Text></View>
                          {correct && (
                            <View style={[mainStyles.chip, mainStyles.chipOk]}>
                              <Text style={[mainStyles.chipText, { color: colors.ok }]}>✓ {correct.text}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={mainStyles.qitemDel}
                        onPress={() => setQuestions(questions.filter((_, j) => j !== i))}
                      >
                        <Text style={mainStyles.qitemDelText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {questions.length > 0 && !addingQuestion && (
              <TouchableOpacity style={mainStyles.addBtn} onPress={() => setAddingQuestion(true)}>
                <Text style={mainStyles.addBtnPlus}>+</Text>
                <Text style={mainStyles.addBtnText}>הוסף שאלה</Text>
              </TouchableOpacity>
            )}

            {addingQuestion && (
              <QuestionForm
                index={questions.length}
                onAdd={handleAddQuestion}
                onCancel={() => setAddingQuestion(false)}
              />
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const mainStyles = StyleSheet.create({
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
    backgroundColor: colors.cream, borderBottomWidth: 1,
    borderBottomColor: 'rgba(20,18,26,0.06)',
  },
  headerTitle: { fontFamily: fonts.display, fontWeight: '800', fontSize: 18, color: colors.ink },

  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },

  quizHead: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'flex-end', gap: 16, marginBottom: 20,
  },
  quizKicker: {
    fontFamily: fonts.num, fontSize: 12, fontWeight: '600',
    letterSpacing: 0.08, textTransform: 'uppercase', color: colors.inkMute,
  },
  quizTitle: {
    fontFamily: fonts.display, fontWeight: '800', fontSize: 28,
    letterSpacing: -0.025, color: colors.ink, textAlign: 'right',
  },
  quizDesc: { fontSize: 14.5, color: colors.ink3, textAlign: 'right', marginTop: 4 },
  quizActions: { flexDirection: 'row', gap: 8, flexShrink: 0 },
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

  empty: {
    backgroundColor: colors.paper, borderWidth: 1,
    borderColor: 'rgba(20,18,26,0.06)', borderRadius: radii.xl,
    padding: 36, alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.display, fontWeight: '800', fontSize: 22,
    letterSpacing: -0.02, color: colors.ink, marginBottom: 8, textAlign: 'center',
  },
  emptySub: {
    fontFamily: fonts.body, fontSize: 14, lineHeight: 22,
    color: colors.ink3, textAlign: 'center', marginBottom: 22,
  },
  primaryBtnLg: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    paddingVertical: 16, paddingHorizontal: 24,
    backgroundColor: colors.primary, borderRadius: radii.pill,
    shadowColor: colors.primaryDeep, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  primaryBtnLgPlus: { fontFamily: fonts.display, fontWeight: '900', fontSize: 20, color: '#fff', lineHeight: 20 },
  primaryBtnLgText: { fontFamily: fonts.display, fontWeight: '700', fontSize: 16, color: '#fff' },

  qitem: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 14,
    backgroundColor: colors.paper, borderWidth: 1,
    borderColor: 'rgba(20,18,26,0.06)', borderRadius: radii.lg, padding: 18,
  },
  qitemNum: { fontFamily: fonts.num, fontWeight: '700', fontSize: 22, color: colors.inkMute, minWidth: 32 },
  qitemBody: { flex: 1, alignItems: 'flex-end', gap: 8 },
  qitemText: { fontFamily: fonts.display, fontWeight: '600', fontSize: 16, color: colors.ink, textAlign: 'right' },
  qitemMeta: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: colors.cream, borderWidth: 1,
    borderColor: 'rgba(20,18,26,0.08)', borderRadius: radii.pill,
  },
  chipOk: { backgroundColor: 'rgba(30,158,95,0.1)', borderColor: 'rgba(30,158,95,0.25)' },
  chipText: { fontFamily: fonts.num, fontSize: 12, fontWeight: '600', color: colors.ink3 },
  qitemDel: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  qitemDelText: { color: colors.ink3, fontWeight: '700', fontSize: 12 },

  addBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8, width: '100%', padding: 16, marginBottom: 14,
    borderWidth: 2, borderColor: 'rgba(20,18,26,0.18)',
    borderRadius: radii.lg, borderStyle: 'dashed',
  },
  addBtnPlus: { fontFamily: fonts.display, fontWeight: '900', fontSize: 20, color: colors.ink3 },
  addBtnText: { fontFamily: fonts.display, fontWeight: '700', fontSize: 15, color: colors.ink3 },
});