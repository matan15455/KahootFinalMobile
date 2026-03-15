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

export default function Login() {
  const [idUser, setIdUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    setError('');

    if (!idUser.trim() || !password.trim()) {
      setError('יש למלא תעודת זהות וסיסמה');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${SERVER_URL}/auth/login`, {
        params: { id: idUser, password }
      });

      await login(res.data.token);
      router.replace('/main/my-quizzes');

    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה בהתחברות');
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

          <Text style={styles.kicker}>התחברות</Text>
          <Text style={styles.title}>התחבר למשתמש שלך</Text>
          <Text style={styles.subtitle}>הכנס תעודת זהות וסיסמה</Text>

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
            placeholder="סיסמה"
            placeholderTextColor="rgba(234,240,255,0.5)"
            value={password}
            onChangeText={setPassword}
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
              : <Text style={styles.buttonText}>התחבר ←</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.link}>
              עדיין אין לך חשבון?{' '}
              <Text style={styles.linkBold}>הירשם</Text>
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