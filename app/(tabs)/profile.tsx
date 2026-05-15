import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors, SCREEN_TOP_PADDING } from '@/constants/Colors';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[ps.root, { paddingTop: insets.top + 20 }]}>
      <View style={ps.avatar}>
        <Ionicons name="person-outline" size={40} color={AppColors.accent} />
      </View>
      <Text style={ps.name}>יעל</Text>
      <Text style={ps.sub}>הפרופיל שלי</Text>
    </View>
  );
}

const ps = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.background, alignItems: 'center', gap: 10 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: AppColors.accentLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  name: { fontSize: 22, fontWeight: '700', color: AppColors.text },
  sub: { fontSize: 14, color: AppColors.textSub },
});
