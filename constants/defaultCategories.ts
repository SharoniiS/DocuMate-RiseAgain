import type { Category } from '../context/CategoriesContext';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'receipts',
    name: 'זיכויים',
    color: '#4fd1c5',
    icon: 'receipt',
    items: [],
    keywords: [
      'זיכוי', 'החזר', 'קבלה', 'חשבונית',
      'credit', 'refund', 'receipt', 'invoice',
    ],
  },
  {
    id: 'medicalDocs',
    name: 'מסמכים רפואיים',
    color: '#f56565',
    icon: 'file-medical',
    items: [],
    keywords: [
      'רופא', 'דוקטור', 'מרפאה', 'רפואי', 'מחלה', 'טיפול',
      'בדיקה', 'אבחנה', 'תרופה', 'מומחה', 'הפניה', 'בית חולים',
      'clinic', 'hospital', 'doctor', 'diagnosis', 'treatment', 'prescription',
    ],
  },
  {
    id: 'orthopedic',
    name: 'אורטופדיה',
    parentId: 'medicalDocs',
    items: [],
    keywords: [
      'אורטופד', 'עמוד שדרה', 'ברך', 'ירך', 'שבר', 'עצם', 'מפרק', 'גיד',
      'orthopedic', 'fracture', 'spine', 'knee', 'hip',
    ],
  },
  {
    id: 'cardiology',
    name: 'קרדיולוגיה',
    parentId: 'medicalDocs',
    items: [],
    keywords: [
      'לב', 'קרדיולוג', 'א.ק.ג', 'אקג', 'לחץ דם', 'עורק',
      'cardiac', 'cardiology', 'ecg', 'ekg', 'blood pressure',
    ],
  },
  {
    id: 'ophthalmology',
    name: 'עיניים',
    parentId: 'medicalDocs',
    items: [],
    keywords: [
      'עיניים', 'עין', 'ראייה', 'רשתית', 'קרנית', 'משקפיים',
      'ophthalmology', 'retina', 'cornea', 'vision',
    ],
  },
  {
    id: 'generalMed',
    name: 'כללי',
    parentId: 'medicalDocs',
    items: [],
  },
];
