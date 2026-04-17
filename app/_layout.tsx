import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';

import { AccessibilityProvider } from '../Context/Accessibility';
import { ThemeProvider } from '../Context/ThemeContext';
import { SubscriptionsProvider } from '../Context/SubscriptionsProvider';

import {
  initNotifications,
  scheduleMonthlyReport,
  checkInactivity,
  scheduleInactivityReminder,
} from '../services/NotificationService';

// Configuration des notifications
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

  const userId = 6;

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    async function setupApp() {
      try {
        console.log('[System] Initialisation...');

        // Demande de permission Android 13+
        if (Platform.OS === 'android') {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;

          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }

          if (finalStatus !== 'granted') {
            console.warn('[Notifications] Permission refusée.');
          } else {
            console.log('[Notifications] Permission OK !');
          }
        }

        // Initialisation des services
        await initNotifications();
        await scheduleMonthlyReport();
        await checkInactivity(3);
        await scheduleInactivityReminder(3);

      } catch (error) {
        console.warn('[System] Erreur setup:', error);
      }
    }

    setupApp();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <SubscriptionsProvider userId={userId}>
          <Stack screenOptions={{ headerShown: false }} />
        </SubscriptionsProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  );
}