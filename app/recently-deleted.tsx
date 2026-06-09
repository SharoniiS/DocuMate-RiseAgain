import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog';
import { AppColors } from '@/constants/Colors';
import { useCategories, TRASH_RETENTION_DAYS } from '@/context/CategoriesContext';

const DAY_MS = 24 * 60 * 60 * 1000;

// כמה ימים נשארו עד מחיקה לצמיתות
function daysLeft(deletedAt: string): number {
  const elapsed = Date.now() - new Date(deletedAt).getTime();
  return Math.max(0, TRASH_RETENTION_DAYS - Math.floor(elapsed / DAY_MS));
}

export default function RecentlyDeletedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trash, categories, restoreDocument, purgeDocument } = useCategories();
  const [pendingPurgeUri, setPendingPurgeUri] = useState<string | null>(null);

  const categoryName = (id: string) =>
    categories.find(c => c.id === id)?.name ?? 'כללי';

  const confirmPurge = async () => {
    if (pendingPurgeUri) await purgeDocument(pendingPurgeUri);
    setPendingPurgeUri(null);
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          onPress={() => router.back()}
          style={s.iconBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="חזרה"
        >
          <Ionicons name="arrow-back" size={22} color={AppColors.text} />
        </Pressable>
        <Text style={s.headerTitle}>נמחקו לאחרונה</Text>
        <View style={s.iconBtn} />
      </View>

      {trash.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="trash-outline" size={48} color={AppColors.border} />
          <Text style={s.emptyText}>אין כאן מסמכים</Text>
          <Text style={s.emptySub}>מסמכים שתמחק יופיעו כאן ויישמרו {TRASH_RETENTION_DAYS} יום.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
        >
          <Text style={s.notice}>
            מסמכים נשמרים כאן {TRASH_RETENTION_DAYS} יום ואז נמחקים לצמיתות. עד אז אפשר לשחזר.
          </Text>

          {trash.map(entry => {
            const left = daysLeft(entry.deletedAt);
            const isPdf = entry.item.uri.toLowerCase().endsWith('.pdf');
            return (
              <View key={entry.item.uri} style={s.card}>
                <View style={s.thumbWrap}>
                  {isPdf ? (
                    <View style={s.pdfThumb}>
                      <Ionicons name="document-text-outline" size={28} color={AppColors.brand} />
                    </View>
                  ) : (
                    <Image source={{ uri: entry.item.uri }} style={s.thumb} resizeMode="cover" />
                  )}
                </View>

                <View style={s.body}>
                  <Text style={s.title} numberOfLines={1}>
                    {entry.item.title || 'מסמך ללא שם'}
                  </Text>
                  <Text style={s.sub} numberOfLines={1}>{categoryName(entry.fromCategoryId)}</Text>
                  <Text style={s.countdown}>
                    {left > 0 ? `יישמר עוד ${left} ימים` : 'יימחק היום'}
                  </Text>

                  <View style={s.actions}>
                    <Pressable
                      onPress={() => restoreDocument(entry.item.uri)}
                      style={({ pressed }) => [s.restoreBtn, pressed && { opacity: 0.7 }]}
                      accessibilityRole="button"
                      accessibilityLabel="שחזור מסמך"
                    >
                      <Ionicons name="arrow-undo-outline" size={16} color="#fff" />
                      <Text style={s.restoreText}>שחזר</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setPendingPurgeUri(entry.item.uri)}
                      style={({ pressed }) => [s.purgeBtn, pressed && { opacity: 0.7 }]}
                      accessibilityRole="button"
                      accessibilityLabel="מחיקה לצמיתות"
                    >
                      <Text style={s.purgeText}>מחק לצמיתות</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <ConfirmDeleteDialog
        visible={pendingPurgeUri !== null}
        onConfirm={confirmPurge}
        onCancel={() => setPendingPurgeUri(null)}
        message="למחוק את המסמך לצמיתות? לא ניתן יהיה לשחזר אותו."
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    backgroundColor: '#fff',
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: AppColors.text },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 32 },
  emptyText: { fontSize: 17, fontWeight: '600', color: AppColors.textSub },
  emptySub: { fontSize: 13, color: AppColors.textSub, textAlign: 'center', lineHeight: 19 },

  listContent: { padding: 16, gap: 12 },
  notice: {
    fontSize: 13,
    color: AppColors.textSub,
    backgroundColor: AppColors.chip,
    borderRadius: 10,
    padding: 12,
    textAlign: 'right',
    lineHeight: 19,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
  },
  thumbWrap: { width: 84, height: 84 },
  thumb: { width: 84, height: 84 },
  pdfThumb: {
    width: 84, height: 84,
    backgroundColor: AppColors.accentLight,
    justifyContent: 'center', alignItems: 'center',
  },
  body: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 3, alignItems: 'flex-end' },
  title: { fontSize: 15, fontWeight: '600', color: AppColors.text },
  sub: { fontSize: 12, color: AppColors.textSub },
  countdown: { fontSize: 12, color: AppColors.accent, fontWeight: '500' },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.brand,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  restoreText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  purgeBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  purgeText: { color: AppColors.danger, fontSize: 13, fontWeight: '500' },
});
