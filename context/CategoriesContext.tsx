
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
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

// פריט שנמחק — נשמר ל"נמחקו לאחרונה" וניתן לשחזור
export type TrashedItem = {
  item: CategoryItem;
  fromCategoryId: string;   // מאיזו קטגוריה נמחק (לשחזור)
  deletedAt: string;        // ISO timestamp
};

type CategoriesState = Category[];

// כמה זמן מסמך נשמר ב"נמחקו לאחרונה" לפני מחיקה לצמיתות
export const TRASH_RETENTION_DAYS = 30;
const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

const CATEGORIES_KEY = 'categories';
const TRASH_KEY = 'trash';


interface CategoriesContextType {
  categories: CategoriesState;
  setCategories: React.Dispatch<React.SetStateAction<CategoriesState>>;
  trash: TrashedItem[];
  addDocument: (categoryId: string, item: Omit<CategoryItem, 'createdAt'>) => void;
  /** מחיקה רכה: המסמך עובר ל"נמחקו לאחרונה", הקובץ נשאר על המכשיר וניתן לשחזור */
  deleteDocument: (categoryId: string, idx: number) => void;
  /** שחזור מסמך מ"נמחקו לאחרונה" חזרה לקטגוריה שלו */
  restoreDocument: (uri: string) => void;
  /** מחיקה לצמיתות: מסיר מהסל ומוחק את הקובץ מהמכשיר */
  purgeDocument: (uri: string) => Promise<void>;
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

// מחיקת קובץ מהמכשיר — שקטה, לא מפילה את הזרימה אם הקובץ כבר לא קיים
async function deleteFileQuietly(uri: string) {
  if (!uri || !uri.startsWith('file://')) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (e) {
    console.warn('deleteFileQuietly failed:', String(e), uri);
  }
}


export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<CategoriesState>(initialCategories);
  const [trash, setTrash] = useState<TrashedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const addDocument = (categoryId: string, item: Omit<CategoryItem, 'createdAt'>) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? { ...cat, items: [...cat.items, { ...item, createdAt: new Date().toISOString() }] }
        : cat
    ));
  };

  // מחיקה רכה — מעביר ל"נמחקו לאחרונה" במקום למחוק. הקובץ נשאר על המכשיר.
  const deleteDocument = (categoryId: string, idx: number) => {
    const cat = categories.find(c => c.id === categoryId);
    const item = cat?.items[idx];
    if (!item) return;
    setTrash(prev => [
      { item, fromCategoryId: categoryId, deletedAt: new Date().toISOString() },
      ...prev,
    ]);
    setCategories(prev => prev.map(c =>
      c.id === categoryId ? { ...c, items: c.items.filter((_, i) => i !== idx) } : c
    ));
  };

  // שחזור — חזרה לקטגוריה המקורית, או ל"כללי" אם הקטגוריה כבר לא קיימת
  const restoreDocument = (uri: string) => {
    const entry = trash.find(t => t.item.uri === uri);
    if (!entry) return;
    setTrash(prev => prev.filter(t => t.item.uri !== uri));
    setCategories(prev => {
      const targetId = prev.some(c => c.id === entry.fromCategoryId)
        ? entry.fromCategoryId
        : 'generalMed';
      return prev.map(c =>
        c.id === targetId ? { ...c, items: [...c.items, entry.item] } : c
      );
    });
  };

  // מחיקה לצמיתות — מסיר מהסל ומוחק את הקובץ
  const purgeDocument = async (uri: string) => {
    const entry = trash.find(t => t.item.uri === uri);
    setTrash(prev => prev.filter(t => t.item.uri !== uri));
    if (entry) await deleteFileQuietly(entry.item.uri);
  };

  // טען מה-AsyncStorage פעם אחת, ואם אין נתונים – אתחול לברירת מחדל.
  // בנוסף: מנקה אוטומטית פריטים ב"נמחקו לאחרונה" שעברו את חלון השמירה (ומוחק את הקבצים שלהם).
  const reloadCategories = async () => {
    setLoading(true);
    try {
      const data = await AsyncStorage.getItem(CATEGORIES_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].items) {
          setCategories(parsed);
        } else {
          setCategories(initialCategories);
          await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(initialCategories));
        }
      } else {
        setCategories(initialCategories);
        await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(initialCategories));
      }
    } catch {
      setCategories(initialCategories);
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(initialCategories));
    }

    // טען את "נמחקו לאחרונה" ונקה פריטים שפג תוקפם (כולל מחיקת הקבצים)
    try {
      const rawTrash = await AsyncStorage.getItem(TRASH_KEY);
      const parsedTrash: TrashedItem[] = rawTrash ? JSON.parse(rawTrash) : [];
      const now = Date.now();
      const kept: TrashedItem[] = [];
      const expired: TrashedItem[] = [];
      for (const t of Array.isArray(parsedTrash) ? parsedTrash : []) {
        const age = now - new Date(t.deletedAt).getTime();
        (age >= TRASH_RETENTION_MS ? expired : kept).push(t);
      }
      await Promise.all(expired.map(t => deleteFileQuietly(t.item.uri)));
      setTrash(kept);
    } catch {
      setTrash([]);
    }

    setLoading(false);
  };

  useEffect(() => { reloadCategories(); }, []);

  // שמור כל שינוי ל-AsyncStorage
  useEffect(() => {
    if (!loading) AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  }, [categories, loading]);

  useEffect(() => {
    if (!loading) AsyncStorage.setItem(TRASH_KEY, JSON.stringify(trash));
  }, [trash, loading]);

  return (
    <CategoriesContext.Provider value={{
      categories, setCategories, trash,
      addDocument, deleteDocument, restoreDocument, purgeDocument,
      reloadCategories, loading,
    }}>
      {children}
    </CategoriesContext.Provider>
  );
}


export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used within a CategoriesProvider');
  return ctx;
}
