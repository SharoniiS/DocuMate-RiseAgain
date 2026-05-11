import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type MenuOption = {
  label: string;
  onPress: () => void;
};

export function MenuButton() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  const options: MenuOption[] = [
    { label: 'זיכויים', onPress: () => { setVisible(false); router.push('/credits'); } },
    { label: 'לוח שנה', onPress: () => { setVisible(false); router.push('/calendar'); } },
    { label: 'מסמכים רפואיים', onPress: () => { setVisible(false); router.push('/medical-docs'); } },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => setVisible(true)}>
        <Text style={styles.buttonText}>בחר פעולה</Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.menu}>
            {options.map((option, idx) => (
              <TouchableOpacity key={idx} style={styles.menuItem} onPress={option.onPress}>
                <Text style={styles.menuText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  button: {
    backgroundColor: '#243B55',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    elevation: 2,
  },
  buttonText: {
    color: '#f3eae0',
    fontSize: 18,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    minWidth: 220,
    elevation: 4,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    fontSize: 16,
    color: '#243B55',
    textAlign: 'center',
  },
});
