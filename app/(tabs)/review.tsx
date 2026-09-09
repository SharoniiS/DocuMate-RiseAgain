import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryPickerModal } from '@/components/CategoryPickerModal';
import { AppColors, SCREEN_TOP_PADDING } from '@/constants/Colors';
import { CONFIDENCE_THRESHOLD } from '@/constants/classifier';
import { useCategories } from '@/context/CategoriesContext';
import type { CategoryItem } from '@/context/CategoriesContext';
import { exportFeedbackData } from '@/utils/feedback';

type FilterKey = 'all' | 'corrected' | 'lowConfidence' | 'unlabeled';

interface Row {
  uniqueKey: string;
  item: CategoryItem;
  idx: number;
  categoryId: string;
  categoryName: string;
}

export default function ReviewScreen() {
  const { categories, moveDocument } = useCategories();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [moveTarget, setMoveTarget] = useState<{ fromCatId: string; idx: number } | null>(null);

  const allRows = useMemo<Row[]>(() => {
    const rows: Row[] = [];
    for (const cat of categories) {
      cat.items.forEach((item, idx) => {
        rows.push({
          uniqueKey: `${cat.id}-${idx}-${item.uri}`,
          item,
          idx,
          categoryId: cat.id,
          categoryName: cat.name,
        });
      });
    }
    return rows.sort((a, b) =>
      (b.item.createdAt ?? '').localeCompare(a.item.createdAt ?? '')
    );
  }, [categories]);

  const counters = useMemo(() => {
    const total = allRows.length;
    const corrected = allRows.filter(r => r.item.wasCorrected === true).length;
    const lowConf = allRows.filter(
      r => r.item.predictedConfidence != null && r.item.predictedConfidence < CONFIDENCE_THRESHOLD,
    ).length;
    const pct = total > 0 ? Math.round((corrected / total) * 100) : 0;
    return { total, corrected, pct, lowConf };
  }, [allRows]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'corrected':
        return allRows.filter(r => r.item.wasCorrected === true);
      case 'lowConfidence':
        return allRows.filter(
          r => r.item.predictedConfidence != null && r.item.predictedConfidence < CONFIDENCE_THRESHOLD,
        );
      case 'unlabeled':
        return allRows.filter(r => r.item.predictedCategoryId == null);
      default:
        return allRows;
    }
  }, [allRows, filter]);

  const filterChips: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'הכל' },
    { key: 'corrected', label: 'תוקנו' },
    { key: 'lowConfidence', label: 'ביטחון נמוך' },
    { key: 'unlabeled', label: 'ללא תיוג' },
  ];

  const handleExport = async () => {
    const records = exportFeedbackData(categories);
    if (records.length === 0) {
      Alert.alert('אין נתונים', 'לא נמצאו מסמכים עם תיוג AI לייצוא.');
      return;
    }
    const docDir = FileSystem.documentDirectory;
    if (!docDir) {
      Alert.alert('שגיאה', 'תיקיית המסמכים לא זמינה.');
      return;
    }
    const path = `${docDir}feedback_${Date.now()}.json`;
    try {
      await FileSystem.writeAsStringAsync(path, JSON.stringify(records, null, 2));
      console.log('[feedback] exported', records.length, 'records to', path);
      Alert.alert(
        'הייצוא הושלם',
        `${records.length} רשומות נשמרו ב:\n${path}`,
      );
    } catch (e) {
      console.error('feedback export failed:', String(e));
      Alert.alert('שגיאה', 'שמירת הקובץ נכשלה.');
    }
  };

  const onPickMoveTarget = (newCatId: string) => {
    if (!moveTarget) return;
    if (newCatId === moveTarget.fromCatId) {
      setMoveTarget(null);
      return;
    }
    moveDocument(moveTarget.fromCatId, moveTarget.idx, newCatId);
    setMoveTarget(null);
  };

  const renderRow = ({ item: row }: { item: Row }) => {
    const { item } = row;
    const predictedCat = item.predictedCategoryId
      ? categories.find(c => c.id === item.predictedCategoryId)
      : null;
    const isPdf = item.uri.toLowerCase().endsWith('.pdf');
    const corrected =
      item.predictedCategoryId != null && item.predictedCategoryId !== row.categoryId;

    return (
      <Pressable
        style={styles.row}
        onPress={() =>
          router.push(`/document?catId=${row.categoryId}&uri=${encodeURIComponent(item.uri)}`)
        }
      >
        {isPdf ? (
          <View style={styles.thumbPdf}>
            <Ionicons name="document-text-outline" size={22} color={AppColors.brand} />
          </View>
        ) : (
          <Image source={{ uri: item.uri }} style={styles.thumb} resizeMode="cover" />
        )}

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title || 'מסמך'}
          </Text>

          {predictedCat ? (
            <Text style={styles.aiLine} numberOfLines={1}>
              AI: {predictedCat.name} · {Math.round((item.predictedConfidence ?? 0) * 100)}%
            </Text>
          ) : (
            <Text style={styles.aiLineMuted} numberOfLines={1}>
              AI: ללא תיוג
            </Text>
          )}

          <View style={styles.actualRow}>
            {corrected && (
              <Ionicons
                name="swap-horizontal-outline"
                size={13}
                color={AppColors.teal}
                style={{ marginLeft: 4 }}
              />
            )}
            <Text style={[styles.actualLine, corrected && styles.actualLineCorrected]} numberOfLines={1}>
              בתיקייה: {row.categoryName}
            </Text>
          </View>

          {item.matchedKeywords && item.matchedKeywords.length > 0 && (
            <View style={styles.tagsRow}>
              {item.matchedKeywords.slice(0, 3).map(k => (
                <View key={k} style={styles.tag}>
                  <Text style={styles.tagTxt}>{k}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            setMoveTarget({ fromCatId: row.categoryId, idx: row.idx });
          }}
          style={({ pressed }) => [styles.moveBtn, pressed && { opacity: 0.6 }]}
          hitSlop={10}
        >
          <Ionicons name="folder-open-outline" size={20} color={AppColors.brand} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.pageSubtitle}>תיקון ה-AI</Text>
          <Text style={styles.pageTitle}>סקירה</Text>
        </View>

        <View style={styles.countersRow}>
          <View style={styles.counter}>
            <Text style={styles.counterValue}>{counters.total}</Text>
            <Text style={styles.counterLabel}>{'סה"כ'}</Text>
          </View>
          <View style={styles.counter}>
            <Text style={styles.counterValue}>
              {counters.corrected} <Text style={styles.counterPct}>({counters.pct}%)</Text>
            </Text>
            <Text style={styles.counterLabel}>תוקנו</Text>
          </View>
          <View style={styles.counter}>
            <Text style={styles.counterValue}>{counters.lowConf}</Text>
            <Text style={styles.counterLabel}>ביטחון נמוך</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          <View style={{ flex: 1 }} />
          {[...filterChips].reverse().map(f => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, filter === f.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="albums-outline" size={48} color={AppColors.border} />
            <Text style={styles.emptyText}>אין מסמכים להצגה</Text>
            <Text style={styles.emptySub}>
              {filter === 'all' ? 'סרקי מסמך כדי להתחיל' : 'נסי פילטר אחר'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={r => r.uniqueKey}
            renderItem={renderRow}
            contentContainerStyle={{ paddingBottom: 56 + insets.bottom + 90 }}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        )}

        <Pressable
          onPress={handleExport}
          style={({ pressed }) => [
            styles.fab,
            { bottom: insets.bottom + 70 },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={styles.fabText}>ייצוא</Text>
        </Pressable>
      </View>

      <CategoryPickerModal
        visible={moveTarget !== null}
        selectedCategoryId={moveTarget ? moveTarget.fromCatId : null}
        onSelect={onPickMoveTarget}
        onClose={() => setMoveTarget(null)}
        title="העבר לתיקייה"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  container: { flex: 1 },

  titleRow: {
    paddingHorizontal: 16,
    paddingTop: SCREEN_TOP_PADDING,
    paddingBottom: 8,
    alignItems: 'flex-end',
  },
  pageSubtitle: { fontSize: 12, color: AppColors.textSub, fontWeight: '500' },
  pageTitle: { fontSize: 24, fontWeight: '700', color: AppColors.text },

  countersRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  counter: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 12,
    alignItems: 'flex-end',
  },
  counterValue: { fontSize: 18, fontWeight: '700', color: AppColors.text },
  counterPct: { fontSize: 12, fontWeight: '500', color: AppColors.textSub },
  counterLabel: { fontSize: 11, color: AppColors.textSub, marginTop: 2 },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  chipActive: { backgroundColor: AppColors.text, borderColor: AppColors.text },
  chipText: { fontSize: 12, color: AppColors.textSub, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  thumb: { width: 44, height: 56, borderRadius: 6, backgroundColor: AppColors.accentLight },
  thumbPdf: {
    width: 44, height: 56, borderRadius: 6,
    backgroundColor: AppColors.accentLight,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 15, fontWeight: '600', color: AppColors.text,
    textAlign: 'right', marginBottom: 2,
  },
  aiLine: { fontSize: 12, color: AppColors.accent, textAlign: 'right' },
  aiLineMuted: { fontSize: 12, color: AppColors.textSub, textAlign: 'right' },
  actualRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 1,
  },
  actualLine: { fontSize: 12, color: AppColors.textSub, textAlign: 'right' },
  actualLineCorrected: { color: AppColors.teal, fontWeight: '600' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 5 },
  tag: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 999, backgroundColor: AppColors.chip,
  },
  tagTxt: { fontSize: 10, color: AppColors.textSub },
  moveBtn: {
    width: 38, height: 38, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: AppColors.accentLight,
  },
  sep: { height: 1, backgroundColor: AppColors.border, marginHorizontal: 16 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: AppColors.textSub },
  emptySub: { fontSize: 13, color: AppColors.border, textAlign: 'center' },

  fab: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.brand,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: AppColors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
