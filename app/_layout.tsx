import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { I18nManager } from 'react-native';

import { CategoriesProvider } from '../context/CategoriesContext';

import { useColorScheme } from '@/hooks/useColorScheme';

I18nManager.forceRTL(true);

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <CategoriesProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="document" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </CategoriesProvider>
  );
}
