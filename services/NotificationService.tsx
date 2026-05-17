import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── CONFIGURATION DU HANDLER ────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const KEYS = {
  LAST_EXPENSE_DATE: 'last_expense_date',
  BUDGET_ALERT_SENT: 'budget_alert_sent_',
  MONTHLY_REPORT_ID: 'monthly_report_notif_id',
  INACTIVITY_ID: 'inactivity_notif_id',
  PUSH_TOKEN: 'push_token',
};

const monthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}`;
};

// ════════════════════════════════════════════════════════════════
// 1. INITIALISATION & PERMISSIONS
// ════════════════════════════════════════════════════════════════
export async function initNotifications(): Promise<string | null> {
  if (!Device.isDevice && Platform.OS === 'ios') return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log("Permission de notification refusée !");
    return null;
  }

  let token = null;
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.modules?.ExpoUpdates?.projectId;
    if (projectId) {
      token = (await Notifications.getDevicePushTokenAsync()).data;
      if (token) {
        await AsyncStorage.setItem(KEYS.PUSH_TOKEN, token);
      }
    }
  } catch (error) {
    console.log("Erreur lors de la récupération du token Push:", error);
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Général',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    await Notifications.setNotificationChannelAsync('budget', {
      name: 'Alertes Budget',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
    });
  }

  return token;
}

// ════════════════════════════════════════════════════════════════
// 2. ALERTES SEUILS BUDGETS (APPELÉ APRÈS AJOUT)
// ════════════════════════════════════════════════════════════════
export async function checkBudgetAlerts(currentTotal: number, limit: number): Promise<void> {
  if (limit <= 0) return;

  const ratio = (currentTotal / limit) * 100;
  const currentMonth = monthKey();

  let threshold: number | null = null;
  let message = "";

  if (ratio >= 100) {
    threshold = 100;
    message = "🚨 Attention ! Vous avez dépassé 100% de votre budget mensuel.";
  } else if (ratio >= 80) {
    threshold = 80;
    message = "⚠️ Alerte ! Vous avez atteint 80% de votre budget mensuel.";
  }

  if (threshold !== null) {
    const key = `${KEYS.BUDGET_ALERT_SENT}${currentMonth}_${threshold}`;
    const alreadySent = await AsyncStorage.getItem(key);

    if (!alreadySent) {
      await sendLocalNotification({
        title: threshold === 100 ? "Budget Dépassé" : "Budget Presque Atteint",
        body: message,
        channelId: 'budget',
      });
      await AsyncStorage.setItem(key, 'true');
    }
  }
}

// ════════════════════════════════════════════════════════════════
// 3. RAPPELS EN ARRIÈRE-PLAN
// ════════════════════════════════════════════════════════════════
export async function recordExpenseActivity(): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_EXPENSE_DATE, new Date().toISOString());

  const oldId = await AsyncStorage.getItem(KEYS.INACTIVITY_ID);
  if (oldId) await Notifications.cancelScheduledNotificationAsync(oldId);

  const newId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "✍️ Petite baisse de régime ?",
      body: "N'oubliez pas de noter vos dépenses d'aujourd'hui pour garder vos graphiques à jour !",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3 * 24 * 60 * 60, // 3 jours d'inactivité
      repeats: false,
    } as any,
  });

  await AsyncStorage.setItem(KEYS.INACTIVITY_ID, newId);
}

export async function scheduleMonthlyReportNotification(): Promise<void> {
  const oldId = await AsyncStorage.getItem(KEYS.MONTHLY_REPORT_ID);
  if (oldId) return;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "📊 Votre bilan mensuel est prêt !",
      body: "Le mois vient de se terminer. Venez découvrir le résumé complet de vos finances.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 10,
      minute: 0,
    } as any,
  });

  await AsyncStorage.setItem(KEYS.MONTHLY_REPORT_ID, id);
}

// ✅ ALIAS AJOUTÉ : Permet d'éviter le crash au démarrage ("scheduleMonthlyReport is not a function")
export async function scheduleMonthlyReport(): Promise<void> {
  return scheduleMonthlyReportNotification();
}

export async function checkSubscriptionAlerts(subscriptions: any[]): Promise<void> {
  const now = new Date();
  for (const sub of subscriptions) {
    if (!sub.nextBillingDate) continue;
    const billDate = new Date(sub.nextBillingDate);
    const diffDays = Math.ceil((billDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 2) {
      const key = `sub_alert_${sub.id}_${monthKey()}`;
      if (!(await AsyncStorage.getItem(key))) {
        await sendLocalNotification({
          title: "📅 Abonnement proche",
          body: `Prélèvement pour ${sub.category?.name || 'Abonnement'} bientôt.`,
          channelId: 'default'
        });
        await AsyncStorage.setItem(key, 'true');
      }
    }
  }
}

// ════════════════════════════════════════════════════════════════
// 4. CŒUR DU SERVICE (LOGIQUE COMMUNE)
// ════════════════════════════════════════════════════════════════
export async function sendLocalNotification(params: {title: string, body: string, channelId?: string, data?: any}) {
  const { title, body, channelId = 'default', data = {} } = params;
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: { channelId } as any,
  });
}

export async function cancelMonthlyReport() {
  const id = await AsyncStorage.getItem(KEYS.MONTHLY_REPORT_ID);
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
    await AsyncStorage.removeItem(KEYS.MONTHLY_REPORT_ID);
  }
}

// ════════════════════════════════════════════════════════════════
// 5. COMPARAISON BACKEND (DÉCLENCHÉ À LA RÉCEPTION DE L'API)
// ════════════════════════════════════════════════════════════════
export async function checkComparisonNotifications(params: {
  changeDepenses: number;
  changeRevenus: number;
  currentDepenses: number;
  currentRevenus: number;
}): Promise<void> {
  const { changeDepenses, currentDepenses } = params;

  // Si les dépenses ont augmenté de plus de 15% par rapport au mois dernier
  if (changeDepenses > 15 && currentDepenses > 0) {
    // ✅ Utilisation de 'storageKey' sécurisée pour éviter le bug global de Babel
    const storageKey = `comparison_alert_${monthKey()}`;

    try {
      const alreadySent = await AsyncStorage.getItem(storageKey);
      if (!alreadySent) {
        await sendLocalNotification({
          title: "📈 Dépenses en hausse ce mois-ci",
          body: `Vous avez dépensé ${changeDepenses.toFixed(0)}% de plus que le mois dernier.`,
          channelId: 'budget',
        });
        await AsyncStorage.setItem(storageKey, 'true');
      }
    } catch (e) {
      console.error("Erreur lors de la vérification de la notification de comparaison:", e);
    }
  }
}

