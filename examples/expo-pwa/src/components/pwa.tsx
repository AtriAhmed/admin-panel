import { useEffect } from 'react';
import { Platform } from 'react-native';
import Head from 'expo-router/head';

export function PWAHead() {
  return (
    <Head>
      <meta name="application-name" content="Expo PWA Test" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Expo PWA" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content="#208AEF" />
      <link rel="manifest" href="/manifest.webmanifest" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </Head>
  );
}

export function RegisterServiceWorker() {
  useEffect(() => {
    if (
      Platform.OS !== 'web' ||
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
    });
  }, []);

  return null;
}
