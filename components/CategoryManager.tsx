import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppColors, SCREEN_TOP_PADDING } from '@/constants/Colors';
import { useCategories } from '../context/CategoriesContext';

const PROTECTED_IDS = ['receipts', 'medicalDocs'];

export default function CategoryManager() {
  const { categories, setCategories } = useCategories();
  const [name, setName] = useState('');
  const router = useRouter();

  const addCategory = () => {
    if (!name.trim()) return;
    setCategories(prev => [
      ...prev,
      {
        id: name.trim().replace(/\s+/g, '-').toLowerCase() + '-' + Date.now(),
        name: name.trim(),
        items: [],
      },
    ]);
    setName('');
  };

  const deleteCategory = (id: string) => {
    if (PROTECTED_IDS.includes(id)) return;
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-forward" size={22} color={AppColors.brand} />
        </Pressable>
        <Text style={styles.title}>ניהול תיקיות</Text>
      </View>

      <View style={styles.addRow}>
        <Pressable
          onPress={addCategory}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }, !name.trim() && styles.addBtnDisabled]}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="שם תיקייה חדשה..."
          placeholderTextColor={AppColors.textSub}
          style={styles.input}
          onSubmitEditing={addCategory}
          returnKeyType="done"
        />
      </View>

      <FlatList
        data={categories}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isProtected = PROTECTED_IDS.includes(item.id);
          return (
            <View style={styles.row}>
              {isProtected ? (
                <Ionicons name="lock-closed-outline" size={18} color={AppColors.textSub} />
              ) : (
                <Pressable
                  onPress={() => deleteCategory(item.id)}
                  style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color={AppColors.danger} />
                </Pressable>
              )}
              <Text style={styles.folderName}>{item.name}</Text>
              <Text style={styles.folderCount}>({item.items.length})</Text>
              <Ionicons name="folder" size={24} color={AppColors.teal} style={styles.folderIcon} />
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SCREEN_TOP_PADDING,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.text,
  },
  backBtn: {
    padding: 4,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: AppColors.text,
    textAlign: 'right',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: AppColors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: {
    backgroundColor: AppColors.border,
  },
  list: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  folderIcon: {
    marginLeft: 4,
  },
  folderName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: AppColors.text,
    textAlign: 'right',
  },
  folderCount: {
    fontSize: 13,
    color: AppColors.textSub,
  },
  deleteBtn: {
    padding: 2,
  },
  separator: {
    height: 1,
    backgroundColor: AppColors.border,
    marginHorizontal: 16,
  },
});
