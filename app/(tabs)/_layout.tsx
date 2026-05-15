import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScanModal } from '@/components/ScanModal';
import { AppColors } from '@/constants/Colors';

function ScanFAB() {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
      >
        <View style={[styles.fabInner, { marginBottom: insets.bottom + 4 }]}>
          <Ionicons name="scan-outline" size={26} color="#fff" />
        </View>
      </Pressable>
      <ScanModal visible={visible} onClose={() => setVisible(false)} />
    </>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppColors.brand,
        tabBarInactiveTintColor: AppColors.textSub,
        tabBarStyle: {
          backgroundColor: AppColors.surface,
          borderTopColor: AppColors.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'בית',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="folders"
        options={{
          title: 'תיקיות',
          tabBarIcon: ({ color }) => <Ionicons name="folder-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: '',
          tabBarButton: () => <ScanFAB />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'מסמכים',
          tabBarIcon: ({ color }) => <Ionicons name="document-text-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'אני',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: AppColors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: AppColors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
