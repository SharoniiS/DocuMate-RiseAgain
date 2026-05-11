import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import CategoryManager from '../components/CategoryManager';

export default function ManageCategoriesScreen() {
  return (
    <LinearGradient colors={['#243B55', '#141E30']} style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 48, paddingHorizontal: 18 }}>
        <CategoryManager />
      </View>
    </LinearGradient>
  );
}
