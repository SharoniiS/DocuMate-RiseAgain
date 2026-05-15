export interface ClassificationResult {
  category: string;
  score: number;
  matched: string[];
}

const RULES: { category: string; keywords: string[] }[] = [
  {
    category: 'credit',
    keywords: ['זיכוי', 'החזר', 'credit', 'refund'],
  },
  {
    category: 'receipt',
    keywords: ['קבלה', 'חשבונית', 'receipt', 'invoice'],
  },
  {
    category: 'orthopedic',
    keywords: ['אורטופד', 'עמוד שדרה', 'ברך', 'ירך', 'שבר', 'עצם', 'מפרק', 'גיד', 'orthopedic', 'fracture', 'spine', 'knee', 'hip'],
  },
  {
    category: 'cardiology',
    keywords: ['לב', 'קרדיולוג', 'א.ק.ג', 'אקג', 'לחץ דם', 'עורק', 'cardiac', 'cardiology', 'ecg', 'ekg', 'blood pressure'],
  },
  {
    category: 'ophthalmology',
    keywords: ['עיניים', 'עין', 'ראייה', 'רשתית', 'קרנית', 'משקפיים', 'ophthalmology', 'retina', 'cornea', 'vision'],
  },
  {
    category: 'medical',
    keywords: ['רופא', 'דוקטור', 'מרפאה', 'רפואי', 'מחלה', 'טיפול', 'בדיקה', 'אבחנה', 'תרופה', 'מומחה', 'הפניה', 'בית חולים', 'clinic', 'hospital', 'doctor', 'diagnosis', 'treatment', 'prescription'],
  },
];

// מחזיר category ID התואם ל-context, או null
export function classifyToCategoryId(text: string): string | null {
  const words = normalize(text);
  const idMap: Record<string, string> = {
    credit: 'receipts',
    receipt: 'receipts',
    orthopedic: 'orthopedic',
    cardiology: 'cardiology',
    ophthalmology: 'ophthalmology',
    medical: 'medicalDocs',
  };
  for (const rule of RULES) {
    const matched = words.filter(w => rule.keywords.some(k => w.includes(k)));
    if (matched.length > 0) return idMap[rule.category] ?? null;
  }
  return null;
}

// שמור תאימות לקוד ישן
export function classify(text: string): ClassificationResult[] {
  const words = normalize(text);
  for (const rule of RULES) {
    const matched = words.filter(w => rule.keywords.some(k => w.includes(k)));
    if (matched.length > 0) return [{ category: rule.category, score: 1, matched }];
  }
  return [{ category: 'receipt', score: 0, matched: [] }];
}

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[₪$€£]/g, ' ')
    .replace(/ש["'.]?ח/g, 'שח')
    .replace(/\bדר\b|\bד.ר\b|\bד׳ר\b|\bד"ר\b/g, 'דוקטור')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}
