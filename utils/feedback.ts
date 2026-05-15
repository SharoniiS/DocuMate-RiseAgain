import type { Category } from '../context/CategoriesContext';

export type FeedbackRecord = {
  predicted: string | null;
  actual: string;
  confidence: number;
  matched: string[];
  wasCorrected: boolean;
  ocrText?: string;
  createdAt?: string;
};

export function exportFeedbackData(categories: Category[]): FeedbackRecord[] {
  const records: FeedbackRecord[] = [];
  for (const cat of categories) {
    for (const item of cat.items) {
      if (item.predictedCategoryId === undefined) continue;
      records.push({
        predicted: item.predictedCategoryId ?? null,
        actual: cat.id,
        confidence: item.predictedConfidence ?? 0,
        matched: item.matchedKeywords ?? [],
        wasCorrected: item.wasCorrected ?? false,
        ocrText: item.ocrText,
        createdAt: item.createdAt,
      });
    }
  }
  return records;
}
