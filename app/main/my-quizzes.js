import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, StyleSheet,useWindowDimensions
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { SERVER_URL } from '../../utils/socket';
import {fonts, radii , useThemeColors } from '../../constants/theme';
import EpQuizCard from '../../components/EpQuizCard';
import { EpShape } from '../../components/EpBrand';

export default function MyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const colors = useThemeColors();

  const myqStyles = getmyqStyles(colors);

  const { token } = useAuth();
  const router = useRouter();

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const fetchQuizzes = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/quizzes/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuizzes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  // כל פעם שהמשתמש נכנס למסך הזה
  useFocusEffect(useCallback(() => { fetchQuizzes(); }, []));

  // מחיקת חידון
  const handleDelete = (id) => {
    Alert.alert('מחיקת חידון', 'למחוק את החידון לצמיתות?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק', style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${SERVER_URL}/quizzes/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setQuizzes(prev => prev.filter(q => q._id !== id));
          } catch {
            Alert.alert('שגיאה', 'לא ניתן למחוק את החידון');
          }
        },
      },
    ]);
  };

  // אם המסך טוען
  if (loading && !refreshing) {
    return (
      <View style={[myqStyles.container, myqStyles.center]}>
        <ActivityIndicator size="large" color={colors.primary}/>
        <Text style={myqStyles.loaderText}>טוען את הספרייה שלך…</Text>
      </View>
    );
  }

  const count = quizzes.length;
  const totalQ = quizzes.reduce((s, q) => s + (q.questions?.length || 0), 0);

  const renderHeader = () => (
    <View style={myqStyles.header}>
      <View style={{ flex: 1 }}>
        <Text style={myqStyles.title}>החידונים שלי</Text>
        <Text style={myqStyles.kicker}>
          {count > 0 && (
            <Text style={myqStyles.kickerStat}>
              {''} {count === 1 ? 'חידון אחד' :count + " " + 'חידונים'}
              {totalQ > 0 && `  ·  ${totalQ} שאלות`}
            </Text>
          )}
        </Text>
      </View>

      {count > 0 && (
        <TouchableOpacity
          style={myqStyles.cta}
          activeOpacity={0.85}
          onPress={() => router.push('/main/create-quiz')}
        >
          <Text style={myqStyles.ctaPlus}>+</Text>
          <Text style={myqStyles.ctaText}>חידון חדש</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={myqStyles.empty}>
      <View style={myqStyles.emptyArt}>
        <View style={[myqStyles.shapeAbs, { top: 0,  left: 20 }]}>
          <EpShape kind="burst" color={colors.ans1} size={40}/>
        </View>
        <View style={[myqStyles.shapeAbs, { top: 30, right: 0, transform: [{ rotate: '8deg' }] }]}>
          <EpShape kind="hex" color={colors.ans2} size={50}/>
        </View>
        <View style={[myqStyles.shapeAbs, { bottom: 0, left: 50 }]}>
          <EpShape kind="plus" color={colors.ans3} size={36}/>
        </View>
        <View style={[myqStyles.shapeAbs, { top: 20, left: 100, transform: [{ rotate: '-12deg' }] }]}>
          <EpShape kind="wave" color={colors.ans4} size={44}/>
        </View>
      </View>

      <Text style={myqStyles.emptyTitle}>אין כאן עדיין חידונים</Text>
      <Text style={myqStyles.emptySub}>
        לא יצרת חידונים עדיין
      </Text>

      <View style={{ flexDirection: 'column', gap: 10, alignItems: 'stretch', width: '100%' }}>
        <TouchableOpacity
          style={myqStyles.cta}
          activeOpacity={0.85}
          onPress={() => router.push('/main/create-quiz')}
        >
          <Text style={myqStyles.ctaPlus}>+</Text>
          <Text style={myqStyles.ctaText}>צור חידון ראשון</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[myqStyles.cta, myqStyles.ctaGhost]}
          activeOpacity={0.85}
          onPress={() => router.push('/main/join-room')}
        >
          <Text style={[myqStyles.ctaText, { color: colors.ink }]}>או הצטרף לחדר  </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={myqStyles.container}>
      <FlatList
        data={quizzes}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <EpQuizCard
            quiz={item}
            colorIndex={index}
            onPress={() => router.push(
              `/main/create-room?quizId=${item._id}&title=${encodeURIComponent(item.title)}`
            )}
            onDelete={handleDelete}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          myqStyles.list,
          isLandscape && { maxWidth: 480, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchQuizzes(); }}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const getmyqStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  center: { justifyContent: 'center', alignItems: 'center', gap: 16 },
  loaderText: {
    fontFamily: fonts.num, fontSize: 12, fontWeight: '500',
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.inkMute,
  },

  list: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120, // מקום לבר הצף התחתון
  },

  // Header
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 14,
  },
  kicker: {
    fontFamily: fonts.num, fontSize: 11, fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.inkMute,
    textAlign: 'right',
    marginBottom: 6,
  },
  kickerStat: { color: colors.ink3 },
  title: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 36, letterSpacing: -0.9, lineHeight: 38,
    color: colors.ink,
    textAlign: 'right',
  },

  // CTA primary
  cta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, shadowRadius: 0,
    elevation: 4,
  },
  ctaPlus: {
    fontFamily: fonts.display, fontWeight: '900',
    fontSize: 22, color: '#fff', lineHeight: 22,
  },
  ctaText: {
    fontFamily: fonts.display, fontWeight: '700',
    fontSize: 14, color: '#fff',
  },
  ctaGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(20,18,26,0.18)',
    shadowOpacity: 0,
    elevation: 0,
  },

  // Empty state
  empty: {
    marginTop: 28,
    backgroundColor: colors.paper,
    borderWidth: 1, borderColor: 'rgba(20,18,26,0.06)',
    borderRadius: radii.xl,
    padding: 32,
    alignItems: 'center',
  },
  emptyArt: {
    width: 220, height: 130,
    marginBottom: 22,
    position: 'relative',
  },
  shapeAbs: { position: 'absolute', opacity: 0.85 },
  emptyTitle: {
    fontFamily: fonts.display, fontWeight: '800',
    fontSize: 26, letterSpacing: -0.6,
    color: colors.ink, marginBottom: 10,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 14, lineHeight: 22,
    color: colors.ink3,
    textAlign: 'center',
    marginBottom: 22,
  },
});
