import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '@/constants/Colors';
import { useCategories } from '@/context/CategoriesContext';

interface Props {
  visible: boolean;
  selectedCategoryId: string | null;
  onSelect: (categoryId: string) => void;
  onClose: () => void;
  title?: string;
}

export function CategoryPickerModal({ visible, selectedCategoryId, onSelect, onClose, title }: Props) {
  const { categories } = useCategories();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={AppColors.textSub} />
            </Pressable>
            <Text style={styles.title}>{title ?? 'בחרי תיקייה'}</Text>
            <View style={{ width: 32 }} />
          </View>
          <ScrollView contentContainerStyle={styles.list}>
            {categories.map(cat => {
              const selected = selectedCategoryId === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => onSelect(cat.id)}
                  style={[styles.row, selected && styles.rowSelected]}
                >
                  <Text style={[styles.name, selected && styles.nameSelected]}>
                    {cat.parentId
                      ? `${categories.find(c => c.id === cat.parentId)?.name ?? ''} › ${cat.name}`
                      : cat.name}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={20} color={AppColors.brand} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AppColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
  },
  list: {
    gap: 6,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  rowSelected: {
    borderColor: AppColors.brand,
    backgroundColor: AppColors.accentLight,
  },
  name: {
    fontSize: 15,
    color: AppColors.text,
    fontWeight: '500',
    textAlign: 'right',
  },
  nameSelected: {
    color: AppColors.brand,
    fontWeight: '700',
  },
});
