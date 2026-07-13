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

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    setError('');
    if (!username.trim() || !password.trim()) {
      return setError('יש למלא שם משתמש וסיסמה');
    }
    try {
      setLoading(true);
      const res = await axios.get(`${SERVER_URL}/auth/login`, {
        params: { username, password },
      });
      await login(res.data.token);
      router.replace('/main/my-quizzes');
    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  const chips = [
    { c: colors.ans1, k: 'burst', t: 'חידונים מבוססי AI' },
    { c: colors.ans3, k: 'plus',  t: 'סטטיסטיקות'  },
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
        <View style={loginStyles.hero}>
          <View style={[loginStyles.blob, loginStyles.blobA]}/>
          <View style={[loginStyles.blob, loginStyles.blobB]}/>

          <View style={{ paddingTop: 24 }}>
            <EpBrandMark/>
          </View>

          <View style={{ marginTop: 24 }}>
            <View style={loginStyles.kicker}>
            </View>
            <Text style={loginStyles.heroTitle}>
             למידה{'\n'}
               <Text style={{ color: colors.ans3 }}>בכיף.</Text>
            </Text>
          </View>

          <View style={loginStyles.chips}>
            {chips.map((c, i) => (
              <View key={i} style={loginStyles.chip}>
                <EpShape kind={c.k} color={c.c} size={12}/>
                <Text style={loginStyles.chipText}>{c.t}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={loginStyles.form}>
          <View>
            <Text style={loginStyles.formKicker}>התחברות</Text>
            <Text style={loginStyles.formTitle}>ברוכים השבים</Text>
          </View>

          <View style={{ gap: 14 }}>
            {/* שם משתמש */}
            <View>
              <Text style={loginStyles.label}>שם משתמש</Text>
              <TextInput
                style={loginStyles.input}
                placeholder="הזן שם משתמש"
                placeholderTextColor={colors.inkMute}
                autoCapitalize="none"
                autoComplete="username"
                textAlign="right"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            {/* סיסמה */}
            <View>
              <View style={loginStyles.labelRow}>
                <Text style={loginStyles.label}>סיסמה</Text>
                <TouchableOpacity onPress={() => setShowPwd(s => !s)}>
                  <Text style={loginStyles.toggle}>
                    {showPwd ? 'הסתר' : 'הצג'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={loginStyles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.inkMute}
                secureTextEntry={!showPwd}
                autoComplete="current-password"
                textAlign="right"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {error ? (
              <View style={loginStyles.errorBox}>
                <View style={loginStyles.errorIcon}>
                  <Text style={loginStyles.errorIconText}>!</Text>
                </View>
                <Text style={loginStyles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          {/* הגשה */}
          <TouchableOpacity
            style={loginStyles.submit}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={colors.paper}/>
              : <>
                  <Text style={loginStyles.submitText}>התחבר</Text>
                </>
            }
          </TouchableOpacity>

          <View style={loginStyles.divider}>
            <View style={loginStyles.dividerLine}/>
            <Text style={loginStyles.dividerText}>או</Text>
            <View style={loginStyles.dividerLine}/>
          </View>

          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={loginStyles.footerText}>
              חדש כאן?{' '}
              <Text
                style={[loginStyles.link, { color: colors.primary }]}
                onPress={() => router.push('/auth/register')}
              >
                צור חשבון
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const loginStyles = StyleSheet.create({
  hero: {
    backgroundColor: colors.ink,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  blob: { position: 'absolute', borderRadius: 9999, opacity: 0.4 },
  blobA: { top: -80, left: -60, width: 220, height: 220, backgroundColor: colors.ans2 },
  blobB: { bottom: -120, right: 40, width: 200, height: 200, backgroundColor: colors.ans3, opacity: 0.22 },

  kicker: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  kickerDot: { width: 7, height: 7, backgroundColor: colors.ans3, transform: [{ rotate: '45deg' }] },
  kickerText: { color: colors.ans3, fontFamily: fonts.num, fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },

  heroTitle: {
    color: colors.paper, fontFamily: fonts.display, fontWeight: '800',
    fontSize: 38, lineHeight: 40, letterSpacing: -0.8, textAlign: 'right',
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

  form: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28, paddingBottom: 36,
    gap: 22, backgroundColor: colors.cream,
  },

  formKicker: {
    fontFamily: fonts.num, fontSize: 11, fontWeight: '600',
    color: colors.inkMute, letterSpacing: 1.2, marginBottom: 6,
    textTransform: 'uppercase', textAlign: 'right',
  },
  formTitle: {
    fontFamily: fonts.display, fontWeight: '800', fontSize: 32,
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
  },
  submitText: { color: colors.paper, fontFamily: fonts.display, fontSize: 17, fontWeight: '700' },
  submitArrow: { color: colors.paper, fontSize: 20, fontWeight: '700' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(20,18,26,0.1)' },
  dividerText: { fontFamily: fonts.num, color: colors.inkMute, fontSize: 13 },

  footerText: { fontSize: 14, color: colors.ink3, textAlign: 'center' },
  link: { color: colors.ink, fontWeight: '700' },
});