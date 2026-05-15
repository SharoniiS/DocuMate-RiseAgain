export interface ClassifierRule {
  categoryId: string;
  keywords: string[];
}

export interface ClassificationResult {
  categoryId: string | null;
  confidence: number;
  matched: string[];
}

export function classify(text: string, rules: ClassifierRule[]): ClassificationResult {
  const words = normalize(text);
  let best: { categoryId: string; matched: string[] } | null = null;

  for (const rule of rules) {
    const matched = Array.from(new Set(
      rule.keywords
        .map(k => k.toLowerCase())
        .filter(k => words.some(w => w.includes(k)))
    ));
    if (matched.length > 0 && (!best || matched.length > best.matched.length)) {
      best = { categoryId: rule.categoryId, matched };
    }
  }

  if (!best) return { categoryId: null, confidence: 0, matched: [] };
  // 1 match = 0.33, 2 = 0.67, 3+ = 1.0. Tune once we have correction data.
  const confidence = Math.min(1, best.matched.length / 3);
  return { categoryId: best.categoryId, confidence, matched: best.matched };
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
