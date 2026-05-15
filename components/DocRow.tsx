import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppColors } from '../constants/Colors';

export type DocEntry = {
  uniqueKey: string;
  title?: string;
  categoryName: string;
  categoryId: string;
  createdAt?: string;
  keywords: string[];
  uri: string;
};

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

export default function DocRow({ doc, onPress, hideDate }: { doc: DocEntry; onPress?: () => void; hideDate?: boolean }) {
  return (
    <Pressable style={dr.row} onPress={onPress}>
      {/* paper thumbnail */}
      <View style={dr.thumb}>
        {([10, 16, 22, 28] as const).map((top, i) => (
          <View key={i} style={[dr.ln, { top, width: i % 2 ? '60%' : '78%' }]} />
        ))}
        <View style={dr.acc} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={dr.title} numberOfLines={1}>
          {doc.title || 'מסמך ללא שם'}
        </Text>
        <Text style={dr.meta} numberOfLines={1}>{doc.categoryName}</Text>
        {doc.keywords.length > 0 && (
          <View style={dr.tagsRow}>
            {doc.keywords.slice(0, 4).map(t => (
              <View key={t} style={dr.tag}><Text style={dr.tagTxt}>{t}</Text></View>
            ))}
          </View>
        )}
      </View>

      {!hideDate && doc.createdAt ? (
        <Text style={dr.date}>{formatDate(doc.createdAt)}</Text>
      ) : null}
    </Pressable>
  );
}

const dr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    backgroundColor: '#fff',
  },
  thumb: {
    width: 40,
    height: 50,
    borderRadius: 6,
    backgroundColor: AppColors.accentLight,
    overflow: 'hidden',
  },
  ln: {
    position: 'absolute',
    left: 6,
    right: 6,
    height: 2,
    backgroundColor: 'rgba(46,132,255,0.25)',
    borderRadius: 1,
  },
  acc: {
    position: 'absolute',
    bottom: 8,
    left: 6,
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: AppColors.brand,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 3,
    textAlign: 'right',
  },
  meta: {
    fontSize: 12.5,
    color: AppColors.textSub,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 5,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: AppColors.chip,
  },
  tagTxt: {
    fontSize: 11,
    color: AppColors.textSub,
  },
  date: {
    fontSize: 12,
    color: AppColors.textSub,
    alignSelf: 'flex-start',
    paddingTop: 2,
  },
});
