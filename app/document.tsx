import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryPickerModal } from '@/components/CategoryPickerModal';
import { AppColors } from '@/constants/Colors';
import { useCategories } from '@/context/CategoriesContext';

const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

function formatFullDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ב${MONTHS_HE[d.getMonth()]} ${d.getFullYear()}`;
}

export default function DocumentScreen() {
  const { catId, uri } = useLocalSearchParams<{ catId: string; uri: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { categories, moveDocument } = useCategories();
  const [pickerOpen, setPickerOpen] = useState(false);

  const decodedUri = decodeURIComponent(uri ?? '');
  const category = categories.find(c => c.id === catId);
  const itemIdx = category?.items.findIndex(i => i.uri === decodedUri) ?? -1;
  const item = itemIdx >= 0 ? category?.items[itemIdx] : undefined;
  const parentCat = category?.parentId
    ? categories.find(c => c.id === category.parentId)
    : null;
  const predictedCat = item?.predictedCategoryId
    ? categories.find(c => c.id === item.predictedCategoryId)
    : null;

  const onMove = (newCatId: string) => {
    if (!category || itemIdx < 0) {
      setPickerOpen(false);
      return;
    }
    if (newCatId === category.id) {
      setPickerOpen(false);
      return;
    }
    moveDocument(category.id, itemIdx, newCatId);
    setPickerOpen(false);
    router.replace(`/document?catId=${newCatId}&uri=${encodeURIComponent(decodedUri)}`);
  };

  if (!item || !category) {
    return (
      <View style={[dv.root, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={dv.backBtn}>
          <Ionicons name="arrow-back" size={22} color={AppColors.text} />
        </Pressable>
        <View style={dv.notFound}>
          <Text style={dv.notFoundTxt}>המסמך לא נמצא</Text>
        </View>
      </View>
    );
  }

  const breadcrumb = parentCat
    ? `${parentCat.name} · ${category.name}`
    : category.name;

  const isPdf = decodedUri.toLowerCase().endsWith('.pdf');

  return (
    <View style={[dv.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={dv.header}>
        <Pressable onPress={() => router.back()} style={dv.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={AppColors.text} />
        </Pressable>
        <Text style={dv.headerTitle}>מסמך</Text>
        <Pressable style={dv.iconBtn}>
          <Ionicons name="share-outline" size={22} color={AppColors.text} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Breadcrumb + title */}
        <View style={dv.titleBlock}>
          <Text style={dv.breadcrumb}>{breadcrumb}</Text>
          <Text style={dv.title}>{item.title || 'מסמך ללא שם'}</Text>
          <Text style={dv.meta}>{formatFullDate(item.createdAt)}</Text>
        </View>

        {/* Document preview */}
        <View style={dv.previewWrap}>
          {decodedUri ? (
            isPdf ? (
              <View style={dv.pdfPreview}>
                {/* Skeleton lines simulating document */}
                <View style={dv.pdfHeader}>
                  <Ionicons name="document-text-outline" size={32} color={AppColors.accent} />
                  <Text style={dv.pdfLabel}>PDF</Text>
                </View>
                {[90, 100, 70, 95, 60, 85, 45, 80].map((w, i) => (
                  <View key={i} style={[dv.skeletonLine, { width: `${w}%` }]} />
                ))}
              </View>
            ) : (
              <Image source={{ uri: decodedUri }} style={dv.image} resizeMode="contain" />
            )
          ) : (
            <View style={dv.pdfPreview}>
              {[90, 100, 70, 95, 60, 85, 45, 80].map((w, i) => (
                <View key={i} style={[dv.skeletonLine, { width: `${w}%` }]} />
              ))}
            </View>
          )}
        </View>

        {/* Tags */}
        {item.keywords.length > 0 && (
          <View style={dv.tagsSection}>
            <View style={dv.tagsRow}>
              {item.keywords.map(k => (
                <View key={k} style={dv.tag}>
                  <Text style={dv.tagTxt}>{k}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* AI summary card */}
        <View style={dv.aiCard}>
          <View style={dv.aiHead}>
            <View style={dv.aiDot}>
              <Ionicons name="sparkles-outline" size={12} color={AppColors.accent} />
            </View>
            <Text style={dv.aiLabel}>סיכום בשפה פשוטה</Text>
          </View>
          <Text style={dv.aiText}>
            {item.title
              ? `המסמך "${item.title}" שמור תחת ${breadcrumb}.`
              : `מסמך ב${category.name}.`}
            {item.keywords.length > 0
              ? ` מילות מפתח: ${item.keywords.slice(0, 5).join(', ')}.`
              : ''}
          </Text>
        </View>

        {/* AI prediction provenance */}
        {predictedCat && (
          <View style={dv.predCard}>
            <View style={dv.aiHead}>
              <Ionicons name="analytics-outline" size={14} color={AppColors.brand} />
              <Text style={dv.predLabel}>AI אמרה</Text>
            </View>
            <Text style={dv.predText}>
              {predictedCat.name} · ביטחון {Math.round((item.predictedConfidence ?? 0) * 100)}%
              {item.wasCorrected ? '  ·  (תוקן ידנית)' : ''}
            </Text>
            {item.matchedKeywords && item.matchedKeywords.length > 0 && (
              <View style={dv.predTags}>
                {item.matchedKeywords.map(k => (
                  <View key={k} style={dv.predTag}>
                    <Text style={dv.predTagTxt}>{k}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Change category */}
        <Pressable onPress={() => setPickerOpen(true)} style={dv.changeBtn}>
          <Ionicons name="folder-open-outline" size={16} color={AppColors.brand} />
          <Text style={dv.changeBtnTxt}>שנה תיקייה</Text>
        </Pressable>
      </ScrollView>

      <CategoryPickerModal
        visible={pickerOpen}
        selectedCategoryId={category.id}
        onSelect={onMove}
        onClose={() => setPickerOpen(false)}
        title="העבר לתיקייה"
      />
    </View>
  );
}

const dv = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.background },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFoundTxt: { fontSize: 16, color: AppColors.textSub },
  backBtn: { padding: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    backgroundColor: '#fff',
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16, fontWeight: '600', color: AppColors.text,
  },

  titleBlock: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 6,
    alignItems: 'flex-end',
  },
  breadcrumb: {
    fontSize: 12,
    color: AppColors.accent,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.text,
    textAlign: 'right',
    lineHeight: 31,
  },
  meta: {
    fontSize: 13,
    color: AppColors.textSub,
  },

  previewWrap: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: '#fff',
    minHeight: 220,
  },
  image: {
    width: '100%',
    height: 300,
  },
  pdfPreview: {
    padding: 24,
    gap: 10,
    alignItems: 'flex-end',
  },
  pdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    alignSelf: 'flex-end',
  },
  pdfLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.accent,
  },
  skeletonLine: {
    height: 10,
    backgroundColor: AppColors.chip,
    borderRadius: 5,
    alignSelf: 'flex-end',
  },

  tagsSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: AppColors.chip,
  },
  tagTxt: {
    fontSize: 12,
    color: AppColors.textSub,
    fontWeight: '500',
  },

  aiCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: AppColors.accentLight,
    borderColor: AppColors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  aiHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiDot: {
    width: 20, height: 20, borderRadius: 999,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.accent,
    letterSpacing: 0.4,
  },
  aiText: {
    fontSize: 14,
    color: AppColors.text,
    lineHeight: 21,
    textAlign: 'right',
  },

  predCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  predLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.brand,
    letterSpacing: 0.4,
  },
  predText: {
    fontSize: 13,
    color: AppColors.text,
    textAlign: 'right',
  },
  predTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
  },
  predTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: AppColors.chip,
  },
  predTagTxt: {
    fontSize: 11,
    color: AppColors.textSub,
  },

  changeBtn: {
    marginHorizontal: 16,
    marginTop: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingVertical: 12,
  },
  changeBtnTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.brand,
  },
});
