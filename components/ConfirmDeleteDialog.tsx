import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

interface ConfirmDeleteDialogProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
}

export default function ConfirmDeleteDialog({
  visible,
  onConfirm,
  onCancel,
  message = 'האם אתה בטוח שברצונך למחוק?',
}: ConfirmDeleteDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 12, alignItems: 'center', minWidth: 250 }}>
          <Text style={{ fontSize: 16, marginBottom: 16 }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity onPress={onConfirm} style={{ backgroundColor: '#e53e3e', padding: 10, borderRadius: 8, minWidth: 60, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>כן</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancel} style={{ backgroundColor: '#aaa', padding: 10, borderRadius: 8, minWidth: 60, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>לא</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
