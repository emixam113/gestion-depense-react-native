import React, { useEffect, useState } from 'react';
import { Platform, LogBox } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases'; // ✅ Import de RevenueCat

// ✅ CONTEXTES
import { AccessibilityProvider } from '../Context/Accessibility';
import { ThemeProvider } from '../Context/ThemeContext';
import { SubscriptionsProvider } from '../Context/SubscriptionsProvider';

// ✅ SERVICES
import {
  initNotifications,
  scheduleMonthlyReport,
} from '../services/NotificationService';

// 🛑 MASQUER LES WARNINGS TECHNIQUES
LogBox.ignoreLogs([
  'setLayoutAnimationEnabledExperimental',
  'No route named "(tabs)"',
  'Using a Test Store API key',
  'Enqueuing operation in closed dispatcher', // ✅ Ajouté pour ignorer l'erreur de hot-reload
]);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Atkinson-Regular': require('../assets/fonts/AtkinsonHyperlegible-Regular.ttf'),
    'Atkinson-Bold': require('../assets/fonts/AtkinsonHyperlegible-Bold.ttf'),
  });

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    async function setupApp() {
      try {
        console.log('[System] Initialisation de Finéo...');

        // 💳 INITIALISATION REVENUECAT SÉCURISÉE
        if (Platform.OS === 'android') {
          const rcKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || "goog_votre_cle_ici";

          // ✅ Évite de re-configurer le SDK si déjà actif (corrige l'erreur dispatcher)
          const isConfigured = await Purchases.isConfigured();
          if (!isConfigured) {
            await Purchases.configure({ apiKey: rcKey });
            console.log('[System] RevenueCat configuré avec succès');
          }
        }

        // Récupération de l'utilisateur
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.id) {
            setCurrentUserId(parsedUser.id);
          }
        }

        // Permissions Notifications
        if (Platform.OS === 'android') {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          if (existingStatus !== 'granted') {
            await Notifications.requestPermissionsAsync();
          }
        }

        await initNotifications();
        await scheduleMonthlyReport();

        console.log('[System] Services chargés avec succès');

      } catch (error) {
        console.error('[System] Erreur critique au setup:', error);
      }
    }

    setupApp();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <SubscriptionsProvider userId={currentUserId}>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Route initiale */}
            <Stack.Screen name="index" />

            {/* ✅ Correction de la route (tabs) */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Écrans additionnels */}
            <Stack.Screen name="screens/LoginScreen" options={{ presentation: 'card' }} />
            <Stack.Screen name="screens/Signup" options={{ presentation: 'card' }} />
            <Stack.Screen name="screens/Forgot-Password" options={{ presentation: 'modal' }} />
            <Stack.Screen name="screens/Settings" />
            <Stack.Screen name="screens/OfferScreen" />
          </Stack>
        </SubscriptionsProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  );
}