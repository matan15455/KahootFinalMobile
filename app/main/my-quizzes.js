import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { SERVER_URL } from '../../utils/socket';
import { Ionicons } from '@expo/vector-icons';

export default function MyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const { token } = useAuth();
  const router = useRouter();

  const fetchQuizzes = async () => {
    try {
      setError('');
      const res = await axios.get(`${SERVER_URL}/quizzes/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה בטעינת השאלונים');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // טעינה מחדש כל פעם שחוזרים למסך
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchQuizzes();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuizzes();
  };

  const renderQuiz = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/main/create-room?quizId=${item._id}&title=${item.title}`)}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Ionicons name="play-circle-outline" size={26} color="#22d3ee" />
      </View>

      {item.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      ) : null}

      <View style={styles.cardBottom}>
        <View style={styles.badge}>
          <Ionicons name="help-circle-outline" size={14} color="#22d3ee" />
          <Text style={styles.badgeText}>{item.questions?.length ?? 0} שאלות</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#22d3ee" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>השאלונים שלי</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/main/create-quiz')}
        >
          <Ionicons name="add" size={22} color="#070815" />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {quizzes.length === 0 && !error ? (
        <View style={styles.centered}>
          <Ionicons name="document-outline" size={56} color="rgba(234,240,255,0.2)" />
          <Text style={styles.emptyText}>עדיין אין לך שאלונים</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/main/create-quiz')}
          >
            <Text style={styles.createBtnText}>צור שאלון ראשון</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={quizzes}
          keyExtractor={(item) => item._id}
          renderItem={renderQuiz}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#22d3ee"
            />
          }
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070815',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
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
    fontSize: 26,
    fontWeight: '900',
  },
  addBtn: {
    backgroundColor: '#22d3ee',
    borderRadius: 50,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    color: '#eaf0ff',
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
    textAlign: 'right',
  },
  cardDesc: {
    color: 'rgba(234,240,255,0.55)',
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,211,238,0.1)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#22d3ee',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    color: 'rgba(234,240,255,0.4)',
    fontSize: 16,
    fontWeight: '600',
  },
  createBtn: {
    backgroundColor: 'rgba(34,211,238,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createBtnText: {
    color: '#eaf0ff',
    fontSize: 15,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: 'rgba(251,113,133,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(251,113,133,0.38)',
    borderRadius: 14,
    padding: 12,
    margin: 16,
  },
  errorText: {
    color: 'rgba(255,230,236,0.95)',
    fontSize: 13,
    textAlign: 'right',
  },
});