import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { SERVER_URL } from '../../utils/socket';

export default function Register() {
  const [idUser, setIdUser] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    setError('');

    if (!idUser.trim() || !name.trim() || !email.trim() || !phone.trim() || !birthday.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('יש למלא את כל השדות');
      return;
    }

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    try {
      setLoading(true);

      // שלב 1: הרשמה
      await axios.post(`${SERVER_URL}/auth/register`, {
        id: idUser,
        name,
        email,
        phone,
        birthday,
        password,
      });

      // שלב 2: לוגין אוטומטי אחרי הרשמה
      const loginRes = await axios.get(`${SERVER_URL}/auth/login`, {
        params: { id: idUser, password }
      });

      await login(loginRes.data.token);
      router.replace('/main/my-quizzes');

    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>

          <Text style={styles.kicker}>הרשמה</Text>
          <Text style={styles.title}>צור חשבון חדש</Text>
          <Text style={styles.subtitle}>הכנס את הפרטים שלך</Text>

          <TextInput
            style={styles.input}
            placeholder="תעודת זהות"
            placeholderTextColor="rgba(234,240,255,0.5)"
            value={idUser}
            onChangeText={setIdUser}
            keyboardType="numeric"
            autoCapitalize="none"
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="שם מלא"
            placeholderTextColor="rgba(234,240,255,0.5)"
            value={name}
            onChangeText={setName}
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="אימייל"
            placeholderTextColor="rgba(234,240,255,0.5)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="טלפון"
            placeholderTextColor="rgba(234,240,255,0.5)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="תאריך לידה (DD/MM/YYYY)"
            placeholderTextColor="rgba(234,240,255,0.5)"
            value={birthday}
            onChangeText={setBirthday}
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="סיסמה"
            placeholderTextColor="rgba(234,240,255,0.5)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign="right"
          />

          <TextInput
            style={styles.input}
            placeholder="אימות סיסמה"
            placeholderTextColor="rgba(234,240,255,0.5)"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textAlign="right"
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>הירשם ←</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.link}>
              כבר יש לך חשבון?{' '}
              <Text style={styles.linkBold}>התחבר</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070815',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 26,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  kicker: {
    color: 'rgba(234,240,255,0.75)',
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'right',
    marginBottom: 8,
  },
  title: {
    color: '#eaf0ff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(234,240,255,0.68)',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    padding: 16,
    color: '#eaf0ff',
    fontSize: 15,
    marginBottom: 14,
  },
  errorBox: {
    backgroundColor: 'rgba(251,113,133,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(251,113,133,0.38)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: 'rgba(255,230,236,0.95)',
    fontSize: 13,
    textAlign: 'right',
  },
  button: {
    backgroundColor: 'rgba(34,211,238,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#eaf0ff',
    fontSize: 16,
    fontWeight: '900',
  },
  link: {
    color: 'rgba(234,240,255,0.62)',
    fontSize: 14,
    textAlign: 'center',
  },
  linkBold: {
    color: '#22d3ee',
    fontWeight: '700',
  },
});