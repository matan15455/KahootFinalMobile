import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CreateQuiz() {
  const router = useRouter();

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#eaf0ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>צור שאלון</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>בחר איך תרצה ליצור את השאלון</Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/main/create-manual')}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="create-outline" size={36} color="#22d3ee" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>יצירה ידנית</Text>
            <Text style={styles.cardDesc}>הוסף שאלות ותשובות בעצמך</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="rgba(234,240,255,0.4)" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/main/create-ai')}
        >
          <View style={[styles.iconWrap, styles.iconAI]}>
            <Ionicons name="sparkles-outline" size={36} color="#a78bfa" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>יצירה עם AI ✨</Text>
            <Text style={styles.cardDesc}>תאר נושא וה-AI יצור שאלות אוטומטית</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="rgba(234,240,255,0.4)" />
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070815',
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
    fontSize: 20,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  subtitle: {
    color: 'rgba(234,240,255,0.55)',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(34,211,238,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconAI: {
    backgroundColor: 'rgba(167,139,250,0.1)',
  },
  cardText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cardTitle: {
    color: '#eaf0ff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardDesc: {
    color: 'rgba(234,240,255,0.5)',
    fontSize: 13,
    textAlign: 'right',
  },
});