
import { CategoryItem, useCategories } from '../context/CategoriesContext';


/**
 * פעולות על קטגוריה (הוספה, מחיקה, שליפה)
 */
export function useCategoryActions(categoryId: string) {
  const { categories, setCategories, loading } = useCategories();
  const category = categories.find(cat => cat.id === categoryId);

  const addItem = (uri: string, keywords: string[] = []) => {
    if (!category) return;
    const newItem: CategoryItem = { uri, keywords };
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? { ...cat, items: [...cat.items, newItem] }
        : cat
    ));
  };

  const deleteItem = (idx: number) => {
    if (!category) return;
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? { ...cat, items: cat.items.filter((_, i) => i !== idx) }
        : cat
    ));
  };

  return {
    addItem,
    deleteItem,
    items: category?.items || [],
    category,
    loading: loading || !category,
  };
}
