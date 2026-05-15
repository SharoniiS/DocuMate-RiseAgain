
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';


// פריט בקטגוריה
export type CategoryItem = {
  uri: string;
  keywords: string[];
  createdAt?: string;
  title?: string;
};

// קטגוריה
export type Category = {
  id: string;
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
  items: CategoryItem[];
};

type CategoriesState = Category[];



interface CategoriesContextType {
  categories: CategoriesState;
  setCategories: React.Dispatch<React.SetStateAction<CategoriesState>>;
  addDocument: (categoryId: string, item: Omit<CategoryItem, 'createdAt'>) => void;
  deleteDocument: (categoryId: string, idx: number) => void;
  reloadCategories: () => Promise<void>;
  loading: boolean;
}



const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);



const initialCategories: CategoriesState = [
  { id: 'receipts', name: 'זיכויים', color: '#4fd1c5', icon: 'receipt', items: [] },
  { id: 'medicalDocs', name: 'מסמכים רפואיים', color: '#f56565', icon: 'file-medical', items: [] },
  { id: 'orthopedic', name: 'אורטופדיה', parentId: 'medicalDocs', items: [] },
  { id: 'cardiology', name: 'קרדיולוגיה', parentId: 'medicalDocs', items: [] },
  { id: 'ophthalmology', name: 'עיניים', parentId: 'medicalDocs', items: [] },
  { id: 'generalMed', name: 'כללי', parentId: 'medicalDocs', items: [] },
];


export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<CategoriesState>(initialCategories);
  const [loading, setLoading] = useState(true);

  const addDocument = (categoryId: string, item: Omit<CategoryItem, 'createdAt'>) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? { ...cat, items: [...cat.items, { ...item, createdAt: new Date().toISOString() }] }
        : cat
    ));
  };

  const deleteDocument = (categoryId: string, idx: number) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? { ...cat, items: cat.items.filter((_, i) => i !== idx) }
        : cat
    ));
  };

  // טען מה-AsyncStorage פעם אחת, ואם אין נתונים – אתחול לברירת מחדל
  const reloadCategories = async () => {
    setLoading(true);
    try {
      const data = await AsyncStorage.getItem('categories');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].items) {
          setCategories(parsed);
        } else {
          setCategories(initialCategories);
          await AsyncStorage.setItem('categories', JSON.stringify(initialCategories));
        }
      } else {
        setCategories(initialCategories);
        await AsyncStorage.setItem('categories', JSON.stringify(initialCategories));
      }
    } catch {
      setCategories(initialCategories);
      await AsyncStorage.setItem('categories', JSON.stringify(initialCategories));
    }
    setLoading(false);
  };

  useEffect(() => { reloadCategories(); }, []);

  // שמור כל שינוי ל-AsyncStorage
  useEffect(() => {
    if (!loading) AsyncStorage.setItem('categories', JSON.stringify(categories));
  }, [categories, loading]);

  return (
    <CategoriesContext.Provider value={{ categories, setCategories, addDocument, deleteDocument, reloadCategories, loading }}>
      {children}
    </CategoriesContext.Provider>
  );
}


export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used within a CategoriesProvider');
  return ctx;
}
