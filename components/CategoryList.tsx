

import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 36, fontWeight: '700', color: '#f3eae0', textAlign: 'center', marginBottom: 24 }}>{title}</Text>
      <ScrollView style={{ width: '100%' }}>
        {items.map((item, idx) => (
          <View key={item.uri} style={{ marginBottom: 24, alignItems: 'center' }}>
            {/* מילות מפתח מעל התמונה */}
            {item.keywords && item.keywords.length > 0 && (
              <View style={{ marginBottom: 4 }}>
                <Text style={{ color: '#facc15', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
                  {item.keywords.slice(0, 5).join(', ')}
                </Text>
              </View>
            )}
            <Text style={{ color: '#CBD5E1', fontSize: 16, marginBottom: 6 }}>{`מסמך #${idx + 1}`}</Text>
            <Pressable onPress={() => setPreviewIdx(idx)} style={styles.thumbPressable}>
              <Image source={{ uri: item.uri }} style={styles.thumbImage} />
              <View style={styles.overlay}><Text style={styles.overlayText}>הצג מסמך</Text></View>
            </Pressable>
            <Pressable onPress={() => confirmDelete(idx)} style={styles.deleteBtn}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>מחק</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
      <ConfirmDeleteDialog
        visible={modalVisible}
        onConfirm={handleDelete}
        onCancel={handleCancel}
        message={`האם אתה בטוח שברצונך למחוק ${title === 'מסמכים רפואיים' ? 'את המסמך' : 'את הקבלה'}?`}
      />
      <Modal visible={previewIdx !== null} transparent animationType="fade" onRequestClose={() => setPreviewIdx(null)}>
        <View style={styles.modalBg}>
          {previewIdx !== null && (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Pressable onPress={() => setPreviewIdx(null)} style={{ alignSelf: 'flex-end', margin: 16, padding: 8, backgroundColor: '#243B55', borderRadius: 8 }}>
                <Text style={{ color: '#facc15', fontWeight: 'bold', fontSize: 18 }}>✕ סגור</Text>
              </Pressable>
              <Image
                source={{ uri: items[previewIdx].uri }}
                style={{ width: '95%', height: 400, borderRadius: 18, borderWidth: 2, borderColor: '#CBD5E1', backgroundColor: '#222' }}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  thumbPressable: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(36,59,85,0.7)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  deleteBtn: {
    marginTop: 8,
    alignSelf: 'center',
    backgroundColor: '#e53e3e',
    padding: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '70%',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
});
