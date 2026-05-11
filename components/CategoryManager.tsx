import React, { useState } from 'react';
import { Button, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useCategories } from '../context/CategoriesContext';

export default function CategoryManager() {
  const { categories, setCategories } = useCategories();
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [icon, setIcon] = useState('');

  const addCategory = () => {
    if (!name.trim()) return;
    setCategories(prev => [
      ...prev,
      {
        id: name.trim().replace(/\s+/g, '-').toLowerCase() + '-' + Date.now(),
        name: name.trim(),
        color: color.trim() || undefined,
        icon: icon.trim() || undefined,
        items: [],
      },
    ]);
    setName('');
    setColor('');
    setIcon('');
  };

  const PROTECTED_IDS = ['receipts', 'medicalDocs'];

  const deleteCategory = (id: string) => {
    if (PROTECTED_IDS.includes(id)) return;
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>ניהול קטגוריות</Text>
      <TextInput
        placeholder="שם קטגוריה"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, borderColor: '#ccc', marginBottom: 8, padding: 8, borderRadius: 8 }}
      />
      <TextInput
        placeholder="צבע (hex)"
        value={color}
        onChangeText={setColor}
        style={{ borderWidth: 1, borderColor: '#ccc', marginBottom: 8, padding: 8, borderRadius: 8 }}
      />
      <TextInput
        placeholder="אייקון (שם)"
        value={icon}
        onChangeText={setIcon}
        style={{ borderWidth: 1, borderColor: '#ccc', marginBottom: 8, padding: 8, borderRadius: 8 }}
      />
      <Button title="הוסף קטגוריה" onPress={addCategory} />
      <FlatList
        data={categories}
        keyExtractor={item => item.id}
        style={{ marginTop: 24 }}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ width: 16, height: 16, backgroundColor: item.color || '#eee', borderRadius: 8, marginRight: 8 }} />
            <Text style={{ flex: 1 }}>{item.name}</Text>
            {!PROTECTED_IDS.includes(item.id) && (
              <TouchableOpacity onPress={() => deleteCategory(item.id)} style={{ backgroundColor: '#e53e3e', padding: 6, borderRadius: 6 }}>
                <Text style={{ color: '#fff' }}>מחק</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}
