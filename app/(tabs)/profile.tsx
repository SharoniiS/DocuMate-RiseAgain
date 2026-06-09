import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/Colors';
import { useCategories } from '@/context/CategoriesContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { trash } = useCategories();

  return (
    <View style={[ps.root, { paddingTop: insets.top + 20 }]}>
      <View style={ps.head}>
        <View style={ps.avatar}>
          <Ionicons name="person-outline" size={40} color={AppColors.accent} />
        </View>
        <Text style={ps.name}>יעל</Text>
        <Text style={ps.sub}>הפרופיל שלי</Text>
      </View>

      <View style={ps.list}>
        <Pressable
          onPress={() => router.push('/recently-deleted')}
          style={({ pressed }) => [ps.row, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="נמחקו לאחרונה"
        >
          <Ionicons name="chevron-back" size={18} color={AppColors.textSub} />
          <View style={ps.rowTextGroup}>
            <Text style={ps.rowTitle}>נמחקו לאחרונה</Text>
            {trash.length > 0 && (
              <Text style={ps.rowSub}>{trash.length} מסמכים</Text>
            )}
          </View>
          <View style={ps.rowIcon}>
            <Ionicons name="trash-outline" size={20} color={AppColors.brand} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const ps = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.background, gap: 24 },
  head: { alignItems: 'center', gap: 10 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: AppColors.accentLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  name: { fontSize: 22, fontWeight: '700', color: AppColors.text },
  sub: { fontSize: 14, color: AppColors.textSub },

  list: {
    marginHorizontal: 16,
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  rowTextGroup: { flex: 1, alignItems: 'flex-end', gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: AppColors.text },
  rowSub: { fontSize: 13, color: AppColors.textSub },
  rowIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: AppColors.accentLight,
    alignItems: 'center', justifyContent: 'center',
  },
});
