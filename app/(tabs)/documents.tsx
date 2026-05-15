import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors, SCREEN_TOP_PADDING } from '@/constants/Colors';
import { useCategories } from '@/context/CategoriesContext';
import { CategoryItem } from '@/context/CategoriesContext';
import DocRow from '@/components/DocRow';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 12;
const CARD_PADDING = 16;
const NUM_COLUMNS = 2;
const CARD_SIZE = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

type FilterKey = string;
type ViewMode = 'grid' | 'list';

interface DocEntry {
  uniqueKey: string;
  item: CategoryItem;
  categoryId: string;
  categoryName: string;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

function getDayShort(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_HE[d.getMonth()].slice(0, 3)}`;
}

function getMonthKey(iso?: string): string {
  if (!iso) return 'ללא תאריך';
  const d = new Date(iso);
  return `${MONTHS_HE[d.getMonth()]} ${d.getFullYear()}`;
}

export default function DocumentsScreen() {
  const { categories } = useCategories();
  const params = useLocalSearchParams<{ filter?: string }>();
  const router = useRouter();
  const initialFilter = params.filter ?? 'all';
  const [viewMode, setViewMode] = useState<ViewMode>(params.filter ? 'list' : 'grid');
  const [activeFilter, setActiveFilter] = useState<FilterKey>(initialFilter);
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();

  const filters = useMemo(() => {
    const parentCat = categories.find(c => c.id === initialFilter);
    const children = parentCat ? categories.filter(c => c.parentId === parentCat.id) : [];
    if (children.length > 0) {
      return [
        { key: initialFilter, label: 'הכל' },
        ...children.map(c => ({ key: c.id, label: c.name })),
      ];
    }
    return [
      { key: 'all', label: 'הכל' },
      ...categories.filter(c => !c.parentId).map(cat => ({ key: cat.id, label: cat.name })),
    ];
  }, [categories, initialFilter]);

  const allDocs = useMemo<DocEntry[]>(() =>
    categories.flatMap(cat =>
      cat.items.map((item, idx) => ({
        uniqueKey: `${cat.id}-${idx}-${item.uri}`,
        item,
        categoryId: cat.id,
        categoryName: cat.name,
      }))
    ),
    [categories]
  );

  const filtered = useMemo(() => {
    const childIds = categories.filter(c => c.parentId === activeFilter).map(c => c.id);
    let docs = activeFilter === 'all'
      ? allDocs
      : allDocs.filter(d => d.categoryId === activeFilter || childIds.includes(d.categoryId));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      docs = docs.filter(d =>
        d.categoryName.toLowerCase().includes(q) ||
        (d.item.title ?? '').toLowerCase().includes(q) ||
        d.item.keywords.some(k => k.includes(q))
      );
    }
    return docs;
  }, [allDocs, activeFilter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, DocEntry[]>();
    [...filtered]
      .sort((a, b) => (b.item.createdAt ?? '').localeCompare(a.item.createdAt ?? ''))
      .forEach(doc => {
        const key = getMonthKey(doc.item.createdAt);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(doc);
      });
    return [...map.entries()];
  }, [filtered]);

  const pageTitle = useMemo(() => {
    if (activeFilter === 'all') return 'כל המסמכים';
    return categories.find(c => c.id === activeFilter)?.name ?? 'מסמכים';
  }, [activeFilter, categories]);

  const navigateToDoc = (doc: DocEntry) => {
    router.push(`/document?catId=${doc.categoryId}&uri=${encodeURIComponent(doc.item.uri)}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* כותרת + toggle */}
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
            style={({ pressed }) => [styles.toggleBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons
              name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'}
              size={20}
              color={AppColors.brand}
            />
          </Pressable>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.pageSubtitle}>{filtered.length} מסמכים</Text>
            <Text style={styles.pageTitle}>{pageTitle}</Text>
          </View>
        </View>

        {/* חיפוש */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={AppColors.textSub} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="חיפוש לפי שם, רופא, תגית…"
              placeholderTextColor={AppColors.textSub}
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* פילטרים */}
        <View style={styles.filterRow}>
          <View style={{ flex: 1 }} />
          {[...filters].reverse().map(f => (
            <Pressable
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[styles.chip, activeFilter === f.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, activeFilter === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-outline" size={48} color={AppColors.border} />
            <Text style={styles.emptyText}>אין מסמכים עדיין</Text>
            <Text style={styles.emptySub}>לחץ על כפתור הסריקה להוספת מסמך</Text>
          </View>

        ) : viewMode === 'grid' ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.grid, { paddingBottom: 56 + insets.bottom + 16 }]}
          >
            {chunk(filtered, NUM_COLUMNS).map((pair, rowIdx) => (
              <View key={rowIdx} style={styles.gridRow}>
                {pair.map(doc => (
                  <Pressable key={doc.uniqueKey} style={styles.card} onPress={() => navigateToDoc(doc)}>
                    {doc.item.uri.toLowerCase().endsWith('.pdf') ? (
                      <View style={styles.pdfThumb}>
                        <Ionicons name="document-text-outline" size={36} color={AppColors.brand} />
                      </View>
                    ) : (
                      <Image source={{ uri: doc.item.uri }} style={styles.thumb} resizeMode="cover" />
                    )}
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {doc.item.title || 'מסמך'}
                      </Text>
                      <Text style={styles.cardCat} numberOfLines={1}>{doc.categoryName}</Text>
                    </View>
                  </Pressable>
                ))}
                {pair.length < NUM_COLUMNS && (
                  <View style={[styles.card, { backgroundColor: 'transparent', borderColor: 'transparent', elevation: 0 }]} />
                )}
              </View>
            ))}
          </ScrollView>

        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 56 + insets.bottom + 16 }}
          >
            {grouped.map(([month, docs]) => (
              <View key={month}>
                {/* Month header */}
                <View style={styles.monthHeader}>
                  <Text style={styles.monthCount}>{docs.length} קבצים</Text>
                  <Text style={styles.monthTitle}>{month}</Text>
                </View>
                {/* Rows */}
                <View style={styles.monthList}>
                  {docs.map(doc => (
                    <View key={doc.uniqueKey} style={styles.entryRow}>
                      <View style={styles.dateCol}>
                        <Text style={styles.dateDay}>{getDayShort(doc.item.createdAt)}</Text>
                      </View>
                      <View style={styles.docRowWrap}>
                        <DocRow
                          doc={{
                            uniqueKey: doc.uniqueKey,
                            title: doc.item.title,
                            categoryName: doc.categoryName,
                            categoryId: doc.categoryId,
                            createdAt: doc.item.createdAt,
                            keywords: doc.item.keywords,
                            uri: doc.item.uri,
                          }}
                          hideDate
                          onPress={() => navigateToDoc(doc)}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  container: { flex: 1 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: SCREEN_TOP_PADDING,
    paddingBottom: 8,
  },
  pageSubtitle: {
    fontSize: 12,
    color: AppColors.textSub,
    fontWeight: '500',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.text,
  },
  toggleBtn: {
    width: 38, height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchRow: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: AppColors.text,
    textAlign: 'right',
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  chipActive: {
    backgroundColor: AppColors.text,
    borderColor: AppColors.text,
  },
  chipText: {
    fontSize: 13,
    color: AppColors.textSub,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // גריד
  grid: { paddingHorizontal: CARD_PADDING, gap: CARD_GAP },
  gridRow: { flexDirection: 'row', gap: CARD_GAP },
  card: {
    width: CARD_SIZE,
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  thumb: { width: '100%', height: CARD_SIZE },
  pdfThumb: {
    width: '100%',
    height: CARD_SIZE,
    backgroundColor: AppColors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: { padding: 8, gap: 2 },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.text,
    textAlign: 'right',
  },
  cardCat: {
    fontSize: 11,
    color: AppColors.textSub,
    textAlign: 'right',
  },

  // רשימה עם קיבוץ חודשי
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
  },
  monthCount: {
    fontSize: 12,
    color: AppColors.textSub,
    fontWeight: '500',
  },
  monthList: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateCol: {
    width: 54,
    paddingLeft: 16,
    alignItems: 'flex-start',
  },
  dateDay: {
    fontSize: 12,
    color: AppColors.textSub,
    fontWeight: '500',
    textAlign: 'left',
  },
  docRowWrap: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },

  // ריק
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 17, fontWeight: '600', color: AppColors.textSub },
  emptySub: { fontSize: 13, color: AppColors.border, textAlign: 'center' },
});
