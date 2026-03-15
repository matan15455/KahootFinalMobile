import { View, Text, StyleSheet } from 'react-native';

export default function MyQuizzes() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>השאלונים שלי</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070815',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#eaf0ff',
    fontSize: 20,
    fontWeight: '700',
  },
});