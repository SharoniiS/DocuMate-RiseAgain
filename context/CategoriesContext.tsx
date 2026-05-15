
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_CATEGORIES } from '../constants/defaultCategories';


export type CategoryItem = {
  uri: string;
  keywords: string[];
  createdAt?: string;
  title?: string;
  predictedCategoryId?: string | null;
  predictedConfidence?: number;
  matchedKeywords?: string[];
  wasCorrected?: boolean;
  ocrText?: string;
};

export type Category = {
  id: string;
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
  keywords?: string[];
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


export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<CategoriesState>(DEFAULT_CATEGORIES);
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
          setCategories(DEFAULT_CATEGORIES);
          await AsyncStorage.setItem('categories', JSON.stringify(DEFAULT_CATEGORIES));
        }
      } else {
        setCategories(DEFAULT_CATEGORIES);
        await AsyncStorage.setItem('categories', JSON.stringify(DEFAULT_CATEGORIES));
      }
    } catch {
      setCategories(DEFAULT_CATEGORIES);
      await AsyncStorage.setItem('categories', JSON.stringify(DEFAULT_CATEGORIES));
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
