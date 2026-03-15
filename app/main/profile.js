import { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { SERVER_URL } from '../../utils/socket';

export default function Profile() {
  const { token, userId, logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    birthday: '',
    password: '',
  });

  // ── טעינת נתוני משתמש ───────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${SERVER_URL}/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData({
          id: res.data.id,
          name: res.data.name,
          email: res.data.email,
          phone: res.data.phone || '',
          birthday: res.data.birthday || '',
          password: '',
        });
      } catch (err) {
        Alert.alert('שגיאה', err.response?.data?.message || 'שגיאה בטעינת הפרופיל');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, token]);

  // ── שמירת שינויים ────────────────────────────────────
  const handleUpdate = async () => {
    try {
      setSaving(true);
      const updates = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        birthday: userData.birthday,
      };
      if (userData.password) updates.password = userData.password;

      await axios.patch(`${SERVER_URL}/user/${userId}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('✅ הצלחה', 'הפרטים עודכנו בהצלחה');
      setUserData((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      Alert.alert('שגיאה', err.response?.data?.message || 'שגיאה בעדכון הפרופיל');
    } finally {
      setSaving(false);
    }
  };

  // ── מחיקת משתמש ──────────────────────────────────────
  const handleDelete = () => {
    Alert.alert(
      'מחיקת חשבון',
      'האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו בלתי הפיכה.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${SERVER_URL}/user/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              logout();
              router.replace('/auth/login');
            } catch (err) {
              Alert.alert('שגיאה', err.response?.data?.message || 'שגיאה במחיקת החשבון');
            }
          },
        },
      ]
    );
  };

  // ── התנתקות ───────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('התנתקות', 'האם אתה בטוח שברצונך להתנתק?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'התנתק',
        onPress: () => {
          logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#22d3ee" />
        <Text style={styles.loadingText}>טוען פרופיל…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fb7185" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>פרופיל</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar + ID */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userData.name ? userData.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.userName}>{userData.name}</Text>
          <View style={styles.idBadge}>
            <Ionicons name="card-outline" size={14} color="#22d3ee" />
            <Text style={styles.idText}>{userData.id}</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>עריכת פרטים</Text>

          <Field
            label="שם מלא"
            icon="person-outline"
            value={userData.name}
            onChangeText={(v) => setUserData((p) => ({ ...p, name: v }))}
          />
          <Field
            label="אימייל"
            icon="mail-outline"
            value={userData.email}
            onChangeText={(v) => setUserData((p) => ({ ...p, email: v }))}
            keyboardType="email-address"
          />
          <Field
            label="טלפון"
            icon="call-outline"
            value={userData.phone}
            onChangeText={(v) => setUserData((p) => ({ ...p, phone: v }))}
            keyboardType="phone-pad"
          />
          <Field
            label="תאריך לידה"
            icon="calendar-outline"
            value={userData.birthday}
            onChangeText={(v) => setUserData((p) => ({ ...p, birthday: v }))}
            placeholder="YYYY-MM-DD"
          />
          <Field
            label="סיסמה חדשה (אופציונלי)"
            icon="lock-closed-outline"
            value={userData.password}
            onChangeText={(v) => setUserData((p) => ({ ...p, password: v }))}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.btnDisabled]}
            onPress={handleUpdate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.btnRow}>
                <Ionicons name="save-outline" size={18} color="#eaf0ff" />
                <Text style={styles.saveBtnText}>שמור שינויים</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>אזור מסוכן</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color="#fb7185" />
            <Text style={styles.deleteBtnText}>מחק חשבון</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

// ── קומפוננטת שדה ─────────────────────────────────────
function Field({ label, icon, value, onChangeText, keyboardType, secureTextEntry, placeholder }) {
  return (
    <View style={fieldStyles.wrap}>
      <View style={fieldStyles.labelRow}>
        <Ionicons name={icon} size={14} color="rgba(234,240,255,0.5)" />
        <Text style={fieldStyles.label}>{label}</Text>
      </View>
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        secureTextEntry={secureTextEntry || false}
        placeholder={placeholder || ''}
        placeholderTextColor="rgba(234,240,255,0.3)"
        textAlign="right"
        autoCorrect={false}
        autoCapitalize="none"
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    justifyContent: 'flex-end',
  },
  label: { color: 'rgba(234,240,255,0.6)', fontSize: 13 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 14,
    color: '#eaf0ff',
    fontSize: 15,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070815' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, backgroundColor: '#070815' },
  loadingText: { color: 'rgba(234,240,255,0.6)', fontSize: 16 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: { color: '#eaf0ff', fontSize: 20, fontWeight: '800' },

  scroll: { padding: 24, paddingBottom: 60 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(124,58,237,0.3)',
    borderWidth: 2,
    borderColor: 'rgba(124,58,237,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#eaf0ff', fontSize: 36, fontWeight: '900' },
  userName: { color: '#eaf0ff', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(34,211,238,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.25)',
  },
  idText: { color: '#22d3ee', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

  // Card
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
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 18,
  },

  saveBtn: {
    backgroundColor: 'rgba(124,58,237,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtnText: { color: '#eaf0ff', fontSize: 16, fontWeight: '800' },

  // Danger
  dangerCard: {
    backgroundColor: 'rgba(251,113,133,0.06)',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(251,113,133,0.2)',
  },
  dangerTitle: {
    color: '#fb7185',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 14,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(251,113,133,0.3)',
    backgroundColor: 'rgba(251,113,133,0.1)',
  },
  deleteBtnText: { color: '#fb7185', fontSize: 15, fontWeight: '700' },
});