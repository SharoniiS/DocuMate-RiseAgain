import { SafeAreaView, StyleSheet } from 'react-native';
import { AppColors } from '@/constants/Colors';
import CategoryManager from '../components/CategoryManager';

export default function ManageCategoriesScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <CategoryManager />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
});
