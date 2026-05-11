// סיווג טקסט לפי קטגוריות פשוטות בלבד
export interface ClassificationResult {
  category: string;
  score: number; // 0..1
  matched: string[];
}

export function classify(text: string): ClassificationResult[] {
  const words = normalize(text);
  // eslint-disable-next-line no-console
  console.log('[classify] words:', words);
  const creditWords = ['זיכוי', 'credit', 'החזר', 'refund', 'credit note', 'note'];
  const receiptWords = ['קבלה', 'חשבונית', 'receipt', 'invoice'];
  const medicalWords = [
    'רופא', 'דוקטור', 'מרפאה', 'רפואי', 'תיק', 'מחלה', 'טיפול', 'בדיקה', 'אבחנה',
    'תרופה', 'מומחה', 'הפניה', 'בית', 'חולים', 'clinic', 'hospital', 'doctor', 'diagnosis', 'treatment', 'prescription', 'specialist', 'referral'
  ];
  const creditMatched = words.filter((w: string) => creditWords.some(key => w.includes(key)));
  if (creditMatched.length > 0) {
    return [{ category: 'credit', score: 1, matched: creditMatched }];
  }
  const receiptMatched = words.filter((w: string) => receiptWords.some(key => w.includes(key)));
  if (receiptMatched.length > 0) {
    return [{ category: 'receipt', score: 1, matched: receiptMatched }];
  }
  const medicalMatched = words.filter((w: string) => medicalWords.some(key => w.includes(key)));
  if (medicalMatched.length > 0) {
    return [{ category: 'medical', score: 1, matched: medicalMatched }];
  }
  return [
    { category: 'receipt', score: 0, matched: [] },
    { category: 'medical', score: 0, matched: [] },
    { category: 'credit', score: 0, matched: [] }
  ];
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
