import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors, SCREEN_TOP_PADDING } from '@/constants/Colors';
import { useCategories } from '@/context/CategoriesContext';
import { Category } from '@/context/CategoriesContext';

export default function FoldersScreen() {
  const { categories } = useCategories();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);

  const hasChildren = (cat: Category) =>
    categories.some(c => c.parentId === cat.id);

  const displayed = selectedParent
    ? categories.filter(cat => cat.parentId === selectedParent.id)
    : categories.filter(cat => !cat.parentId);

  const totalItems = (cat: Category): number => {
    if (hasChildren(cat)) {
      return categories
        .filter(c => c.parentId === cat.id)
        .reduce((sum, c) => sum + c.items.length, 0);
    }
    return cat.items.length;
  };

  const onPressCategory = (cat: Category) => {
    if (hasChildren(cat)) {
      setSelectedParent(cat);
    } else {
      router.push({ pathname: '/(tabs)/documents', params: { filter: cat.id } });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 56 + insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <Ionicons name="folder" size={28} color={AppColors.accent} />
            {selectedParent ? (
              <View style={styles.breadcrumb}>
                <Text style={styles.pageTitle}>{selectedParent.name}</Text>
                <Text style={styles.breadcrumbRoot}>תיקיות</Text>
              </View>
            ) : (
              <Text style={styles.pageTitle}>תיקיות</Text>
            )}
          </View>
          <Pressable
            onPress={() => router.push('/manage-categories')}
            style={({ pressed }) => [styles.manageBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="settings-outline" size={18} color={AppColors.brand} />
            <Text style={styles.manageBtnText}>ניהול</Text>
          </Pressable>
        </View>

        {selectedParent && (
          <Pressable
            onPress={() => setSelectedParent(null)}
            style={({ pressed }) => [styles.backRow, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="chevron-forward" size={16} color={AppColors.brand} />
            <Text style={styles.backText}>חזרה לכל התיקיות</Text>
          </Pressable>
        )}

        <View style={styles.list}>
          {displayed.map((cat: Category, idx: number) => (
            <View key={cat.id}>
              {idx > 0 && <View style={styles.separator} />}
              <Pressable
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
                onPress={() => onPressCategory(cat)}
              >
                <View style={styles.folderIcon}>
                  <Ionicons
                    name={hasChildren(cat) ? 'folder' : 'folder-open'}
                    size={32}
                    color={AppColors.accent}
                  />
                </View>
                <View style={styles.folderTextGroup}>
                  <Text style={styles.folderName}>{cat.name}</Text>
                  <Text style={styles.folderSub}>{totalItems(cat)} מסמכים</Text>
                </View>
                {hasChildren(cat)
                  ? <Ionicons name="chevron-back" size={18} color={AppColors.brand} />
                  : <Ionicons name="chevron-back" size={18} color={AppColors.textSub} />
                }
              </Pressable>
            </View>
          ))}
          <View style={styles.separator} />
          <Pressable
            onPress={() => router.push('/manage-categories')}
            style={({ pressed }) => [styles.addFolderHint, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="add-circle-outline" size={20} color={AppColors.textSub} />
            <Text style={styles.addFolderHintText}>הוסף תיקייה</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  content: { paddingHorizontal: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SCREEN_TOP_PADDING,
    paddingBottom: 20,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  breadcrumb: {
    alignItems: 'flex-end',
    gap: 2,
  },
  breadcrumbRoot: {
    fontSize: 12,
    color: AppColors.textSub,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: AppColors.text,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  manageBtnText: {
    fontSize: 13,
    color: AppColors.brand,
    fontWeight: '500',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
    alignSelf: 'flex-end',
  },
  backText: {
    fontSize: 13,
    color: AppColors.brand,
    fontWeight: '500',
  },
  list: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 22,
    backgroundColor: AppColors.surface,
    gap: 12,
  },
  folderIcon: { marginLeft: 4 },
  folderTextGroup: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 3,
  },
  folderName: {
    fontSize: 17,
    fontWeight: '600',
    color: AppColors.text,
  },
  folderSub: {
    fontSize: 13,
    color: AppColors.textSub,
  },
  separator: {
    height: 1,
    backgroundColor: AppColors.border,
    marginHorizontal: 16,
  },
  addFolderHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  addFolderHintText: {
    fontSize: 14,
    color: AppColors.textSub,
    fontWeight: '500',
  },
});
