import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../constants/Colors';
import { CategoryItem } from '../context/CategoriesContext';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

interface CategoryListProps {
  title: string;
  items: CategoryItem[];
  onDelete: (idx: number) => void;
}

export default function CategoryList({ title, items, onDelete }: CategoryListProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingDeleteIdx, setPendingDeleteIdx] = useState<number | null>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const confirmDelete = (idx: number) => {
    setPendingDeleteIdx(idx);
    setModalVisible(true);
  };

  const handleDelete = () => {
    if (pendingDeleteIdx === null) return;
    onDelete(pendingDeleteIdx);
    setModalVisible(false);
    setPendingDeleteIdx(null);
    setPreviewIdx(null);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setPendingDeleteIdx(null);
  };

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="document-outline" size={48} color={AppColors.border} />
        <Text style={styles.emptyText}>אין מסמכים עדיין</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item, idx) => (
          <View key={item.uri} style={styles.card}>
            <Pressable onPress={() => setPreviewIdx(idx)} style={styles.thumbWrap}>
              <Image source={{ uri: item.uri }} style={styles.thumb} resizeMode="cover" />
              <View style={styles.overlay}>
                <Ionicons name="expand-outline" size={20} color="#fff" />
                <Text style={styles.overlayText}>הצג מסמך</Text>
              </View>
            </Pressable>

            <View style={styles.cardBody}>
              <Text style={styles.docNum} numberOfLines={1}>{item.title || `מסמך #${idx + 1}`}</Text>
              {item.keywords && item.keywords.length > 0 && (
                <Text style={styles.keywords} numberOfLines={2}>
                  {item.keywords.slice(0, 5).join(' · ')}
                </Text>
              )}
            </View>

            <Pressable
              onPress={() => confirmDelete(idx)}
              style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
              hitSlop={8}
            >
              <Ionicons name="trash-outline" size={18} color={AppColors.danger} />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <ConfirmDeleteDialog
        visible={modalVisible}
        onConfirm={handleDelete}
        onCancel={handleCancel}
        message={`האם אתה בטוח שברצונך למחוק את המסמך?`}
      />

      <Modal visible={previewIdx !== null} transparent animationType="fade" onRequestClose={() => setPreviewIdx(null)}>
        <View style={styles.modalBg}>
          <Pressable onPress={() => setPreviewIdx(null)} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          {previewIdx !== null && (
            <Image
              source={{ uri: items[previewIdx].uri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scroll: { flex: 1 },
  scrollContent: { gap: 12, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  thumbWrap: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  thumb: {
    width: 80,
    height: 80,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  overlayText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'flex-end',
    gap: 4,
  },
  docNum: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
  },
  keywords: {
    fontSize: 12,
    color: AppColors.textSub,
    textAlign: 'right',
  },
  deleteBtn: {
    padding: 12,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: AppColors.textSub,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 52,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  fullImage: {
    width: '95%',
    height: '75%',
    borderRadius: 12,
  },
});
