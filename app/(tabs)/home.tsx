import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/Colors';
import { useCategories } from '@/context/CategoriesContext';
import DocRow from '@/components/DocRow';

const AI_SUGGESTION = {
  text: 'זה נראה כמו MRI של גב מד"ר כהן — מתאים?',
  chips: ['אורתופדיה', 'MRI', 'גב תחתון'],
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { categories } = useCategories();

  const allDocs = useMemo(() =>
    categories.flatMap(cat =>
      cat.items.map(item => ({
        uniqueKey: `${cat.id}-${item.uri}`,
        title: item.title,
        categoryName: cat.name,
        categoryId: cat.id,
        createdAt: item.createdAt,
        keywords: item.keywords,
        uri: item.uri,
      }))
    ).sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
    [categories]
  );

  const recentDocs = allDocs.slice(0, 3);
  const totalDocs = allDocs.length;

  return (
    <View style={[hs.root, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={hs.topbar}>
        <Pressable style={hs.icBtn}>
          <Ionicons name="notifications-outline" size={22} color={AppColors.text} />
        </Pressable>
        <Text style={hs.brand}>DocuMate</Text>
        <Pressable style={hs.icBtn}>
          <Ionicons name="person-circle-outline" size={24} color={AppColors.text} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Greeting */}
        <View style={hs.greeting}>
          <Text style={hs.eyebrow}>בוקר טוב, יעל</Text>
          <Text style={hs.h1}>
            {totalDocs > 0
              ? `יש לך ${totalDocs} מסמכים שמורים.`
              : 'יש לך שלושה מסמכים חדשים לסקור.'}
          </Text>
          <Text style={hs.subTxt}>בלי לחץ — שום דבר לא דחוף.</Text>
        </View>

        {/* AI card */}
        <View style={hs.aiCard}>
          <View style={hs.aiHead}>
            <View style={hs.aiDot}>
              <Ionicons name="sparkles-outline" size={12} color={AppColors.accent} />
            </View>
            <Text style={hs.aiLabel}>אנחנו חושבים</Text>
          </View>
          <Text style={hs.aiQ}>{AI_SUGGESTION.text}</Text>
          <View style={hs.aiChips}>
            {AI_SUGGESTION.chips.map(c => (
              <View key={c} style={hs.chipSugg}>
                <Text style={hs.chipSuggTxt}>{c}</Text>
              </View>
            ))}
          </View>
          <View style={hs.aiActions}>
            <Pressable style={hs.btnPrimary}>
              <Text style={hs.btnPrimaryTxt}>כן, תייק את זה</Text>
            </Pressable>
            <Pressable style={hs.btnGhost}>
              <Text style={hs.btnGhostTxt}>ערוך</Text>
            </Pressable>
          </View>
        </View>

        {/* Recent */}
        <View style={hs.sectionHead}>
          <Text style={hs.sectionTitle}>אחרונים</Text>
          <Pressable onPress={() => router.push('/(tabs)/documents')}>
            <Text style={hs.sectionAll}>הצג הכל</Text>
          </Pressable>
        </View>

        {recentDocs.length > 0 ? (
          <View style={hs.docList}>
            {recentDocs.map(doc => (
              <DocRow
                key={doc.uniqueKey}
                doc={doc}
                onPress={() => router.push(`/document?catId=${doc.categoryId}&uri=${encodeURIComponent(doc.uri)}`)}
              />
            ))}
          </View>
        ) : (
          <View style={hs.emptyHint}>
            <Ionicons name="scan-outline" size={32} color={AppColors.border} />
            <Text style={hs.emptyHintTxt}>סרקי את המסמך הראשון שלך</Text>
            <Text style={hs.emptyHintSub}>לחצי על כפתור הסריקה למטה</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const hs = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.background },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  icBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
    letterSpacing: 0.2,
  },

  greeting: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 6,
  },
  eyebrow: {
    fontSize: 11,
    color: AppColors.textSub,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  h1: {
    fontSize: 26,
    fontWeight: '700',
    color: AppColors.text,
    lineHeight: 33,
    letterSpacing: -0.4,
  },
  subTxt: {
    fontSize: 14,
    color: AppColors.textSub,
    lineHeight: 21,
  },

  aiCard: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: AppColors.accentLight,
    borderColor: AppColors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  aiHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiDot: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.accent,
    letterSpacing: 0.8,
  },
  aiQ: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
    lineHeight: 25,
  },
  aiChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  chipSugg: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: AppColors.border,
    borderStyle: 'dashed',
  },
  chipSuggTxt: {
    fontSize: 12.5,
    fontWeight: '500',
    color: AppColors.accent,
  },
  aiActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-start',
  },
  btnPrimary: {
    backgroundColor: AppColors.accent,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  btnPrimaryTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  btnGhost: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: '#fff',
  },
  btnGhostTxt: {
    color: AppColors.textSub,
    fontSize: 14,
    fontWeight: '500',
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.text,
  },
  sectionAll: {
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.accent,
  },

  docList: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  emptyHint: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyHintTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.textSub,
  },
  emptyHintSub: {
    fontSize: 13,
    color: AppColors.border,
  },
});
