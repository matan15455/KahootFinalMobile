import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { SERVER_URL } from '../../utils/socket';
import { colors, fonts, radii } from '../../constants/theme';
import { EpBrandMark, EpShape } from '../../components/EpBrand';

export default function Register() {
  const [username, setUsername]               = useState('');
  const [password, setPassword]                 = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    setError('');

    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      return setError('יש למלא שם משתמש וסיסמה');
    }

    if (password !== confirmPassword) {
      return setError('הסיסמאות אינן תואמות');
    }

    try {
      setLoading(true);

      await axios.post(`${SERVER_URL}/auth/register`, {
        username,
        password,
      });

      // התחברות אוטומטית אחרי הרשמה
      const res = await axios.get(`${SERVER_URL}/auth/login`, {
        params: { username, password },
      });

      await login(res.data.token);
      router.replace('/main/my-quizzes');

    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  };

  const chips = [
    { c: colors.ans1, k: 'burst', t: 'חידונים מבוססי AI'      },
    { c: colors.ans3, k: 'plus',  t: 'סטטיסטיקות' },
    { c: colors.ans4, k: 'wave',  t: 'זמן אמת'         },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ===== Brand hero ===== */}
        <View style={regStyles.hero}>
          <View style={[regStyles.blob, regStyles.blobA]}/>
          <View style={[regStyles.blob, regStyles.blobB]}/>

          <View style={{ paddingTop: 24 }}>
            <EpBrandMark/>
          </View>

          <View style={{ marginTop: 22 }}>
            <View style={regStyles.kicker}>
            </View>
            <Text style={regStyles.heroTitle}>
              למידה{'\n'}
              <Text style={{ color: colors.ans3 }}>בכיף.</Text>
            </Text>
          </View>

          <View style={regStyles.chips}>
            {chips.map((c, i) => (
              <View key={i} style={regStyles.chip}>
                <EpShape kind={c.k} color={c.c} size={12}/>
                <Text style={regStyles.chipText}>{c.t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ===== Form ===== */}
        <View style={regStyles.form}>
          <View>
            <Text style={regStyles.formKicker}>הרשמה</Text>
            <Text style={regStyles.formTitle}>צור חשבון</Text>
          </View>

          <View style={{ gap: 14 }}>
            {/* שם משתמש */}
            <Field
              label="שם משתמש"
              placeholder="בחר שם משתמש"
              value={username} onChangeText={setUsername}
              autoComplete="username"
              autoCapitalize="none"
            />

            {/* סיסמה */}
            <View>
              <View style={regStyles.labelRow}>
                <Text style={regStyles.label}>סיסמה</Text>
                <TouchableOpacity onPress={() => setShowPwd(s => !s)}>
                  <Text style={regStyles.toggle}>
                    {showPwd ? 'הסתר' : 'הצג'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={regStyles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.inkMute}
                secureTextEntry={!showPwd}
                autoComplete="new-password"
                textAlign="right"
                value={password}
                onChangeText={setPassword}
              />
              <Text style={regStyles.hint}>
                לפחות 8 תווים, אות גדולה, ספרה ותו מיוחד
              </Text>
            </View>

            {/* אימות סיסמה */}
            <Field
              label="אימות סיסמה"
              placeholder="הקלד את הסיסמה שוב"
              value={confirmPassword} onChangeText={setConfirmPassword}
              secureTextEntry={!showPwd}
              autoComplete="new-password"
            />

            {error ? (
              <View style={regStyles.errorBox}>
                <View style={regStyles.errorIcon}>
                  <Text style={regStyles.errorIconText}>!</Text>
                </View>
                <Text style={regStyles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={regStyles.submit}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.paper}/>
              : <>
                  <Text style={regStyles.submitText}>הירשם</Text>
                </>
            }
          </TouchableOpacity>

          {/* Footer */}
          <Text style={regStyles.footerText}>
            כבר יש לך חשבון?{' '}
            <Text
              style={[regStyles.link, { color: colors.primary }]}
              onPress={() => router.push('/auth/login')}
            >
              התחבר
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ── Field helper ───────────────────────────────────────── */
function Field({ label, ...inputProps }) {
  return (
    <View>
      <Text style={regStyles.label}>{label}</Text>
      <TextInput
        style={regStyles.input}
        placeholderTextColor={colors.inkMute}
        textAlign="right"
        {...inputProps}
      />
    </View>
  );
}

const regStyles = StyleSheet.create({
  // ─── HERO ───
  hero: {
    backgroundColor: colors.ink,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  blob: { position: 'absolute', borderRadius: 9999 },
  blobA: { top: -80, left: -60, width: 220, height: 220, backgroundColor: colors.ans1, opacity: 0.32 },
  blobB: { bottom: -120, right: 40, width: 200, height: 200, backgroundColor: colors.ans2, opacity: 0.4 },

  kicker: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  kickerDot: { width: 7, height: 7, backgroundColor: colors.ans3, transform: [{ rotate: '45deg' }] },
  kickerText: { color: colors.ans3, fontFamily: fonts.num, fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },

  heroTitle: {
    color: colors.paper, fontFamily: fonts.display, fontWeight: '800',
    fontSize: 32, lineHeight: 36, letterSpacing: -0.6, textAlign: 'right',
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 22 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 11, paddingVertical: 7,
    backgroundColor: colors.whiteAlpha10,
    borderWidth: 1, borderColor: colors.whiteAlpha20,
    borderRadius: radii.pill,
  },
  chipText: { color: colors.paper, fontFamily: fonts.body, fontSize: 12, fontWeight: '600' },

  // ─── FORM ───
  form: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 26, paddingBottom: 36,
    gap: 20, backgroundColor: colors.cream,
  },

  formKicker: {
    fontFamily: fonts.num, fontSize: 11, fontWeight: '600',
    color: colors.inkMute, letterSpacing: 1.2, marginBottom: 6,
    textTransform: 'uppercase', textAlign: 'right',
  },
  formTitle: {
    fontFamily: fonts.display, fontWeight: '800', fontSize: 30,
    color: colors.ink, letterSpacing: -0.6, textAlign: 'right',
  },
  formSub: {
    fontFamily: fonts.body, fontSize: 14, color: colors.ink3,
    marginTop: 6, textAlign: 'right',
  },

  labelRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  label: {
    fontFamily: fonts.body, fontSize: 13, fontWeight: '600',
    color: colors.ink3, marginBottom: 8, textAlign: 'right',
  },
  toggle: { color: colors.primary, fontSize: 13, fontWeight: '600' },

  input: {
    backgroundColor: colors.paper,
    borderWidth: 2, borderColor: colors.blackAlpha08,
    borderRadius: radii.md,
    paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: fonts.body, fontSize: 15, fontWeight: '500',
    color: colors.ink,
  },
  hint: {
    fontSize: 12, color: colors.inkMute, marginTop: 6,
    textAlign: 'right',
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
  errorIconText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  errorText: { color: colors.bad, fontSize: 14, flex: 1, textAlign: 'right' },

  // Submit
  submit: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.ink,
    paddingVertical: 16, paddingHorizontal: 22,
    borderRadius: radii.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 0,
    elevation: 5,
    marginTop: 4,
  },
  submitText: { color: colors.paper, fontFamily: fonts.display, fontSize: 17, fontWeight: '700' },
  submitArrow: { color: colors.paper, fontSize: 20, fontWeight: '700' },

  footerText: { fontSize: 14, color: colors.ink3, textAlign: 'center' },
  link: { color: colors.primary, fontWeight: '700' },
});
