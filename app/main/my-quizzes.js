import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { SERVER_URL } from '../../utils/socket';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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

  useFocusEffect(
    useCallback(() => {
      fetchQuizzes();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuizzes();
  };

  const renderQuiz = ({ item, index }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.cardWrapper}
      onPress={() => router.push(`/main/create-room?quizId=${item._id}&title=${item.title}`)}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
        style={styles.card}
      >
        <View style={styles.iconContainer}>
            <LinearGradient
                colors={['#22d3ee', '#0ea5e9']}
                style={styles.iconCircle}
            >
                <Ionicons name="flash" size={20} color="#fff" />
            </LinearGradient>
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        
        <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description || "אין תיאור זמין לשאלון זה..."}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.questions?.length ?? 0} שאלות</Text>
          </View>
          <Ionicons name="chevron-back-circle" size={24} color="rgba(255,255,255,0.3)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22d3ee" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#070815']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header Custom */}
      <View style={styles.header}>
        <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => router.push('/main/create-quiz')}
        >
          <LinearGradient
            colors={['#22d3ee', '#06b6d4']}
            style={styles.addBtnGradient}
          >
            <Ionicons name="add" size={28} color="#070815" />
          </LinearGradient>
        </TouchableOpacity>
        
        <View>
            <Text style={styles.headerTitle}>השאלונים שלי</Text>
            <Text style={styles.headerSub}>{quizzes.length} שאלונים מוכנים לשימוש</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      <FlatList
        data={quizzes}
        keyExtractor={(item) => item._id}
        renderItem={renderQuiz}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
             <Ionicons name="rocket-outline" size={80} color="rgba(34,211,238,0.1)" />
             <Text style={styles.emptyText}>הגיע הזמן ליצור משהו גדול!</Text>
             <TouchableOpacity style={styles.emptyCreateBtn} onPress={() => router.push('/main/create-quiz')}>
                <Text style={styles.emptyCreateBtnText}>צור שאלון חדש</Text>
             </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22d3ee" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#070815',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 25,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  headerSub: {
    color: 'rgba(234,240,255,0.5)',
    fontSize: 14,
    textAlign: 'right',
  },
  addBtnGradient: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: (width / 2) - 24,
    marginBottom: 16,
  },
  card: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 190,
    justifyContent: 'space-between',
  },
  iconContainer: {
    marginBottom: 12,
    flexDirection: 'row-reverse'
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 4,
  },
  cardDesc: {
    color: 'rgba(234,240,255,0.5)',
    fontSize: 12,
    textAlign: 'right',
    lineHeight: 16,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#22d3ee',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  emptyCreateBtn: {
    marginTop: 20,
    backgroundColor: '#22d3ee',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 15,
  },
  emptyCreateBtnText: {
    color: '#070815',
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 70, 70, 0.1)',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 70, 70, 0.3)',
  },
  errorText: {
    color: '#ff4646',
    textAlign: 'right',
  }
});