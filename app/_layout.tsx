import { AccessibilityProvider } from './Context/Accessibility';
import { ThemeProvider } from './Context/ThemeContext';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import {
  initNotifications,
  scheduleMonthlyReport,
  checkInactivity,
  scheduleInactivityReminder,
  addNotificationListeners,
} from './services/NotificationService';

// ─── Handler foreground — SDK 53+ ────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,   // ← SDK 53+ (remplace shouldShowAlert)
    shouldShowList: true,     // ← SDK 53+
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

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    async function setup() {
      try {
        // 1. Initialiser les permissions + canaux Android
        await initNotifications();

        // 2. Planifier le rapport mensuel (1er du mois à 9h)
        await scheduleMonthlyReport();

        // 3. Vérifier l'inactivité et planifier le rappel
        await checkInactivity(3);
        await scheduleInactivityReminder(3);

        // 4. Reset des alertes budget le 1er du mois
        const today = new Date();
        if (today.getDate() === 1) {
          const { resetBudgetAlerts } = await import('./services/NotificationService');
          await resetBudgetAlerts();
        }

      } catch (error) {
        console.warn('[Notifications] Erreur initialisation:', error);
      }
    }
    setup();
  }, []);

  useEffect(() => {
    // Listeners — notif reçue en foreground
    const onReceive = (notification: Notifications.Notification) => {
      console.log('[Notif reçue]', notification.request.content.title);
    };

    // Listener — utilisateur tape sur une notif
    const onResponse = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      console.log('[Notif tapée]', data);
      // Vous pouvez ajouter une navigation ici selon data.type
      // ex: if (data.type === 'budget_exceeded') router.push('/(tabs)/stats');
    };

    const cleanup = addNotificationListeners(onReceive, onResponse);
    return cleanup;
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <Stack />
      </AccessibilityProvider>
    </ThemeProvider>
  );
}