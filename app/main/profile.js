// ===================================================================
// app/main/profile.js — EduPlay design
// תואם ל-Profile.jsx של האתר (frontend, branch: design/claudeDesign)
// הוספה: כפתור התנתקות (במובייל אין navbar עליון)
// ===================================================================
import { useState, useEffect } from 'react';
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
import { EpShape } from '../../components/EpBrand';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
  const { token, userId, logout } = useAuth();
  const router = useRouter();

  const [data, setData] = useState({
    id: '', name: '', email: '', phone: '', birthday: '', password: '',
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await axios.get(`${SERVER_URL}/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData({
          id: res.data.id,
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          birthday: res.data.birthday || '',
          password: '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'שגיאה בטעינת הנתונים');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, userId]);

  const update = (k, v) => { setData(p => ({ ...p, [k]: v })); if (error) setError(''); };

  const handleSave = async () => {
    setError('');
    const updates = {
      name: data.name, email: data.email,
      phone: data.phone, birthday: data.birthday,
    };
    if (data.password) updates.password = data.password;
    try {
      setSaving(true);
      await axios.patch(`${SERVER_URL}/user/${userId}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
      setData(p => ({ ...p, password: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה בעדכון');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${SERVER_URL}/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      logout();
      router.replace('/auth/login');
    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה במחיקה');
    }
  };

  const handleLogout = () => {
    Alert.alert('התנתקות', 'בטוח שברצונך להתנתק?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'התנתק', onPress: () => {
          logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[profStyles.container, profStyles.center]}>
        <ActivityIndicator size="large" color={colors.primary}/>
        <Text style={profStyles.loaderText}>טוען פרטים…</Text>
      </View>
    );
  }

  const initials = data.name
    ? data.name.trim().split(' ').map(w => w[0]).join('').slice(0, 2)
    : '?';

  return (
    <KeyboardAvoidingView
      style={profStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={profStyles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ══ Hero Card (Avatar + שם + ת.ז) ══ */}
        <View style={profStyles.hero}>
          <View style={[profStyles.blob, profStyles.blobA]}/>
          <View style={[profStyles.blob, profStyles.blobB]}/>

          {/* צורות דקורטיביות */}
          <View style={[profStyles.deco, { top: 14, left: 18 }]}>
            <EpShape kind="burst" size={24} color={colors.ans3}/>
          </View>
          <View style={[profStyles.deco, { bottom: 18, left: 60, opacity: 0.4 }]}>
            <EpShape kind="plus" size={18} color={colors.paper}/>
          </View>

          {/* Logout button (top-left of hero) */}
          <TouchableOpacity onPress={handleLogout} style={profStyles.logoutBtn} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={22} color={colors.paper}/>
          </TouchableOpacity>

          <View style={profStyles.heroRow}>
            {/* Avatar */}
            <View style={profStyles.avatarWrap}>
              <View style={profStyles.avatarRing}/>
              <View style={profStyles.avatar}>
                <Text style={profStyles.avatarText}>{initials}</Text>
              </View>
            </View>

            <View style={{ flex: 1, alignItems: 'flex-end', gap: 6 }}>
              <Text style={profStyles.heroLabel}>האזור האישי שלך</Text>
              <Text style={profStyles.heroName} numberOfLines={1}>
                {data.name || '—'}
              </Text>
              <View style={profStyles.idBadge}>
                <Text style={profStyles.idLabel}>ת.ז.</Text>
                <Text style={profStyles.idValue}>{data.id}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ══ Toasts ══ */}
        {success && (
          <View style={profStyles.toast}>
            <View style={profStyles.toastIcon}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>✓</Text>
            </View>
            <Text style={profStyles.toastText}>הפרטים עודכנו בהצלחה!</Text>
          </View>
        )}

        {error ? (
          <View style={profStyles.errorBox}>
            <View style={profStyles.errorIcon}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>!</Text>
            </View>
            <Text style={profStyles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ══ Form Card ══ */}
        <View style={profStyles.card}>
          <View>
            <Text style={profStyles.sectionKicker}>פרטי חשבון</Text>
            <Text style={profStyles.sectionTitle}>עריכת פרטים</Text>
          </View>

          <View style={{ gap: 14 }}>
            <Field label="שם מלא" value={data.name}     onChangeText={v => update('name', v)} placeholder="שם מלא"/>
            <Field label="אימייל"  value={data.email}    onChangeText={v => update('email', v)} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none"/>
            <Field label="טלפון"   value={data.phone}    onChangeText={v => update('phone', v)} placeholder="05X-XXXXXXX" keyboardType="phone-pad"/>
            <Field label="תאריך לידה" value={data.birthday} onChangeText={v => update('birthday', v)} placeholder="DD/MM/YYYY"/>

            <View>
              <View style={profStyles.labelRow}>
                <Text style={profStyles.label}>סיסמה חדשה</Text>
                <TouchableOpacity onPress={() => setShowPwd(s => !s)}>
                  <Text style={profStyles.toggle}>{showPwd ? 'הסתר' : 'הצג'}</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={profStyles.input}
                placeholder="השאר ריק אם אין שינוי"
                placeholderTextColor={colors.inkMute}
                secureTextEntry={!showPwd}
                textAlign="right"
                value={data.password}
                onChangeText={v => update('password', v)}
              />
              <Text style={profStyles.hint}>
                לפחות 8 תווים, אות גדולה, ספרה ותו מיוחד
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={profStyles.save}
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff"/>
              : <>
                  <Text style={profStyles.saveText}>שמור שינויים</Text>
                  <Text style={profStyles.saveArrow}>←</Text>
                </>
            }
          </TouchableOpacity>
        </View>

        {/* ══ Danger Zone ══ */}
        <View style={profStyles.danger}>
          <View style={{ marginBottom: 14 }}>
            <Text style={profStyles.dangerTitle}>מחיקת חשבון</Text>
            <Text style={profStyles.dangerDesc}>
              פעולה זו בלתי הפיכה — כל החידונים והנתונים שלך יימחקו לצמיתות.
            </Text>
          </View>

          {!confirmDel ? (
            <TouchableOpacity
              style={profStyles.delBtn}
              activeOpacity={0.85}
              onPress={() => setConfirmDel(true)}
            >
              <Text style={profStyles.delBtnText}>מחק חשבון</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 10 }}>
              <Text style={profStyles.confirmQ}>בטוח לחלוטין?</Text>
              <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                <TouchableOpacity
                  style={[profStyles.confirmBtn, profStyles.confirmYes]}
                  activeOpacity={0.85}
                  onPress={handleDelete}
                >
                  <Text style={{ color: '#fff', fontFamily: fonts.display, fontWeight: '700', fontSize: 13 }}>
                    כן, מחק
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[profStyles.confirmBtn, profStyles.confirmNo]}
                  activeOpacity={0.85}
                  onPress={() => setConfirmDel(false)}
                >
                  <Text style={{ color: colors.ink3, fontFamily: fonts.display, fontWeight: '600', fontSize: 13 }}>
                    ביטול
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ── Field helper ───────────────────────────────────────── */
function Field({ label, ...inputProps }) {
  return (
    <View>
      <Text style={profStyles.label}>{label}</Text>
      <TextInput
        style={profStyles.input}
        placeholderTextColor={colors.inkMute}
        textAlign="right"
        {...inputProps}
      />
    </View>
  );
}

const profStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  center: { justifyContent: 'center', alignItems: 'center', gap: 16 },
  loaderText: {
    fontFamily: fonts.num, fontSize: 12, fontWeight: '500',
    letterSpacing: 1.2, textTransform: 'uppercase', color: colors.inkMute,
  },

  scroll: {
    paddingHorizontal: 20, paddingTop: 60,
    paddingBottom: 120, // מקום לבר התחתון הצף
    gap: 16,
  },

  // ── Hero ──
  hero: {
    backgroundColor: colors.ink,
    borderRadius: radii.xl,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  blob: { position: 'absolute', borderRadius: 9999 },
  blobA: { top: -80, left: -60, width: 200, height: 200, backgroundColor: colors.primary, opacity: 0.22 },
  blobB: { bottom: -100, right: -40, width: 180, height: 180, backgroundColor: colors.ans3, opacity: 0.15 },
  deco: { position: 'absolute' },

  logoutBtn: {
    position: 'absolute', top: 14, left: 14, zIndex: 10,
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  heroRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 20,
    paddingTop: 4,
  },

  avatarWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  avatarRing: {
    position: 'absolute', width: 88, height: 88, borderRadius: 44,
    borderWidth: 2, borderColor: 'rgba(184,225,66,0.35)',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.ans3,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.ans3Ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1, shadowRadius: 0,
    elevation: 6,
  },
  avatarText: {
    fontFamily: fonts.display, fontWeight: '900',
    fontSize: 26, color: colors.ink, letterSpacing: -0.4,
  },

  heroLabel: {
    fontFamily: fonts.num, fontSize: 11, fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: 'rgba(251,248,241,0.6)',
  },
  heroName: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 28, letterSpacing: -0.7, color: colors.paper,
    textAlign: 'right',
  },
  idBadge: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: radii.pill,
  },
  idLabel: {
    fontFamily: fonts.num, fontSize: 10, fontWeight: '700',
    letterSpacing: 0.8, textTransform: 'uppercase',
    color: 'rgba(251,248,241,0.65)',
  },
  idValue: {
    fontFamily: fonts.num, fontSize: 14, fontWeight: '700',
    letterSpacing: 1, color: colors.ans3,
  },

  // ── Toast / Error ──
  toast: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(30,158,95,0.1)',
    borderWidth: 1, borderColor: colors.ok,
    borderRadius: radii.md,
  },
  toastIcon: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.ok,
    alignItems: 'center', justifyContent: 'center',
  },
  toastText: {
    fontFamily: fonts.display, fontWeight: '700',
    fontSize: 14, color: colors.ok, flex: 1, textAlign: 'right',
  },

  errorBox: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: 'rgba(214,58,45,0.08)',
    borderWidth: 1, borderColor: 'rgba(214,58,45,0.28)',
    borderRadius: radii.md,
  },
  errorIcon: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.bad,
    alignItems: 'center', justifyContent: 'center',
  },
  errorText: { color: colors.bad, fontSize: 14, flex: 1, textAlign: 'right' },

  // ── Form Card ──
  card: {
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    borderRadius: radii.xl,
    padding: 22,
    gap: 20,
  },
  sectionKicker: {
    fontFamily: fonts.num, fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase',
    color: colors.inkMute, marginBottom: 4, textAlign: 'right',
  },
  sectionTitle: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 22, letterSpacing: -0.5,
    color: colors.ink, textAlign: 'right',
  },

  label: {
    fontFamily: fonts.body, fontSize: 13, fontWeight: '600',
    color: colors.ink3, marginBottom: 8, textAlign: 'right',
  },
  labelRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  toggle: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: colors.cream,
    borderWidth: 2, borderColor: colors.blackAlpha08,
    borderRadius: radii.md,
    paddingHorizontal: 16, paddingVertical: 13,
    fontFamily: fonts.body, fontSize: 15, fontWeight: '500',
    color: colors.ink,
  },
  hint: {
    fontFamily: fonts.body, fontSize: 12, color: colors.inkMute,
    marginTop: 6, textAlign: 'right',
  },

  save: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 15, paddingHorizontal: 22,
    borderRadius: radii.pill,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 0,
    elevation: 5,
  },
  saveText: { color: '#fff', fontFamily: fonts.display, fontSize: 16, fontWeight: '700' },
  saveArrow: { color: '#fff', fontSize: 20, fontWeight: '700' },

  // ── Danger Zone ──
  danger: {
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(214,58,45,0.2)',
    borderRadius: radii.xl,
    padding: 20,
  },
  dangerTitle: {
    fontFamily: fonts.display, fontWeight: '700',
    fontSize: 16, color: colors.bad,
    marginBottom: 4, textAlign: 'right',
  },
  dangerDesc: {
    fontFamily: fonts.body, fontSize: 13, lineHeight: 19,
    color: colors.ink3, textAlign: 'right',
  },
  delBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, paddingHorizontal: 20,
    backgroundColor: 'transparent',
    borderWidth: 1.5, borderColor: 'rgba(214,58,45,0.3)',
    borderRadius: radii.pill,
  },
  delBtnText: {
    fontFamily: fonts.display, fontWeight: '700',
    fontSize: 14, color: colors.bad,
  },
  confirmQ: {
    fontFamily: fonts.display, fontWeight: '700',
    fontSize: 14, color: colors.bad, textAlign: 'right',
  },
  confirmBtn: {
    flex: 1, paddingVertical: 11,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: radii.pill,
  },
  confirmYes: {
    backgroundColor: colors.bad,
    shadowColor: '#8c1f18',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1, shadowRadius: 0,
    elevation: 4,
  },
  confirmNo: {
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.15)',
  },
});
