
import { useCategories } from '../context/CategoriesContext';

export function useCategoryActions(categoryId: string) {
  const { categories, addDocument, deleteDocument, loading } = useCategories();
  const category = categories.find(cat => cat.id === categoryId);

  const deleteItem = (idx: number) => {
    if (!category) return;
    deleteDocument(categoryId, idx);
  };

  return {
    deleteItem,
    items: category?.items || [],
    category,
    loading: loading || !category,
  };
}
