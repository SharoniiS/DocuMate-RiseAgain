
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import CategoryList from '../components/CategoryList';
import { useCategoryActions } from '../hooks/useCategoryActions';

export default function CreditsScreen() {
  const { items, deleteItem, category } = useCategoryActions('receipts');

  return (
    <LinearGradient colors={['#243B55', '#141E30']} style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 48, paddingHorizontal: 18 }}>
        <CategoryList
          title={category?.name || 'זיכויים'}
          items={items}
          onDelete={deleteItem}
        />
      </View>
    </LinearGradient>
  );
}
