import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { PWAHead, RegisterServiceWorker } from '@/components/pwa';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PWAHead />
      <RegisterServiceWorker />
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
