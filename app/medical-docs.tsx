
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import CategoryList from '../components/CategoryList';
import { useCategoryActions } from '../hooks/useCategoryActions';

/**
 * מסך מסמכים רפואיים
 */
export default function MedicalDocsScreen() {
  const { items, deleteItem, category, loading } = useCategoryActions('medicalDocs');

  if (loading) {
    return (
      <LinearGradient colors={['#243B55', '#141E30']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* אפשר להוסיף Spinner בעתיד */}
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#243B55', '#141E30']} style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 48, paddingHorizontal: 18 }}>
        <CategoryList
          title={category?.name || 'מסמכים רפואיים'}
          items={items}
          onDelete={deleteItem}
        />
      </View>
    </LinearGradient>
  );
}
