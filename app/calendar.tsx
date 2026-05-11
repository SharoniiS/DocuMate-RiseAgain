import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

export default function CalendarScreen() {
  return (
    <LinearGradient colors={['#243B55', '#141E30']} style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>לוח שנה</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 18,
    writingDirection: 'rtl',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#f3eae0',
    textAlign: 'center',
    marginBottom: 24,
  },
});
