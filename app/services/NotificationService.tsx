import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Clés AsyncStorage ───────────────────────────────────────────────
const KEYS = {
  LAST_EXPENSE_DATE: 'last_expense_date',
  BUDGET_ALERT_SENT: 'budget_alert_sent_',
  MONTHLY_REPORT_ID: 'monthly_report_notif_id',
  INACTIVITY_ID: 'inactivity_notif_id',
  PUSH_TOKEN: 'push_token',
};

// ════════════════════════════════════════════════════════════════
// 1. INITIALISATION & PERMISSIONS
// ════════════════════════════════════════════════════════════════
export async function initNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[Notifications] Simulateur détecté — notifications désactivées');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission refusée');
    return null;
  }

  // Canaux Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Général',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#34C759',
    });
    await Notifications.setNotificationChannelAsync('budget', {
      name: 'Alertes Budget',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500],
      lightColor: '#FF3B30',
    });
    await Notifications.setNotificationChannelAsync('rapport', {
      name: 'Rapport Mensuel',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#34C759',
    });
  }

  // ✅ CORRIGÉ — getExpoPushTokenAsync sans projectId
  // fonctionne en dev, à remplacer par { projectId } en production EAS
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    await AsyncStorage.setItem(KEYS.PUSH_TOKEN, token);
    console.log('[Notifications] Token push:', token);
    return token;
  } catch (e) {
    // En Expo Go SDK 53+ les push tokens ne sont pas disponibles — normal
    console.warn('[Notifications] Token push non disponible (Expo Go SDK 53+):', e);
    return null;
  }
}

export async function getPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.PUSH_TOKEN);
}

// ════════════════════════════════════════════════════════════════
// 2. ALERTES BUDGET (80% et 100%)
// ════════════════════════════════════════════════════════════════
interface BudgetAlertParams {
  categoryName: string;
  categoryId: string;
  spent: number;
  budget: number;
}

export async function checkBudgetAlert(params: BudgetAlertParams): Promise<void> {
  const { categoryName, categoryId, spent, budget } = params;
  if (!budget || budget <= 0) return;

  const percentage = (spent / budget) * 100;

  if (percentage >= 80 && percentage < 100) {
    const key80 = KEYS.BUDGET_ALERT_SENT + categoryId + '_80';
    const alreadySent = await AsyncStorage.getItem(key80);
    if (!alreadySent) {
      await sendLocalNotification({
        title: `⚠️ Budget ${categoryName} à 80%`,
        body: `Vous avez dépensé ${spent.toFixed(2)} € sur ${budget.toFixed(2)} € prévus.`,
        channelId: 'budget',
        data: { type: 'budget_alert', categoryId, level: 80 },
      });
      await AsyncStorage.setItem(key80, 'true');
    }
  }

  if (percentage >= 100) {
    const key100 = KEYS.BUDGET_ALERT_SENT + categoryId + '_100';
    const alreadySent = await AsyncStorage.getItem(key100);
    if (!alreadySent) {
      await sendLocalNotification({
        title: `🚨 Budget ${categoryName} dépassé !`,
        body: `Dépensé ${spent.toFixed(2)} € pour un budget de ${budget.toFixed(2)} €. Dépassement de ${(spent - budget).toFixed(2)} €.`,
        channelId: 'budget',
        data: { type: 'budget_alert', categoryId, level: 100 },
      });
      await AsyncStorage.setItem(key100, 'true');
    }
  }
}

export async function resetBudgetAlerts(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const budgetKeys = allKeys.filter(k => k.startsWith(KEYS.BUDGET_ALERT_SENT));
  if (budgetKeys.length > 0) await AsyncStorage.multiRemove(budgetKeys);
  console.log('[Notifications] Alertes budget réinitialisées');
}

// ════════════════════════════════════════════════════════════════
// 3. RAPPORT MENSUEL AUTOMATIQUE
// ════════════════════════════════════════════════════════════════

// ✅ CORRIGÉ — plus de params obligatoires, planifie juste pour le 1er du mois
export async function scheduleMonthlyReport(): Promise<void> {
  await cancelMonthlyReport();

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);
  const secondsUntil = Math.floor((nextMonth.getTime() - now.getTime()) / 1000);

  if (secondsUntil <= 0) return;

  // ✅ CORRIGÉ — trigger SDK 53+ avec type TIME_INTERVAL
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Votre bilan du mois est prêt !',
      body: 'Ouvrez l\'app pour voir votre rapport mensuel complet.',
      data: { type: 'monthly_report' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntil,
      channelId: 'rapport',
    },
  });

  await AsyncStorage.setItem(KEYS.MONTHLY_REPORT_ID, id);
  console.log(`[Notifications] Rapport mensuel planifié pour le ${nextMonth.toLocaleDateString('fr-FR')}`);
}

export async function sendMonthlyReportNow(params: {
  totalDepenses: number;
  totalRevenus: number;
  variationVsMoisPrecedent: number;
  topCategorie: string;
}): Promise<void> {
  const v = params.variationVsMoisPrecedent;
  const variationText = v > 0 ? `+${v.toFixed(0)}% 📈` : v < 0 ? `${v.toFixed(0)}% 📉` : 'Stable';

  await sendLocalNotification({
    title: '📊 Votre bilan du mois est prêt !',
    body: `Dépenses : ${params.totalDepenses.toFixed(2)} € — Revenus : ${params.totalRevenus.toFixed(2)} € — ${variationText}`,
    channelId: 'rapport',
    data: { type: 'monthly_report', ...params },
  });
}

export async function cancelMonthlyReport(): Promise<void> {
  const id = await AsyncStorage.getItem(KEYS.MONTHLY_REPORT_ID);
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
    await AsyncStorage.removeItem(KEYS.MONTHLY_REPORT_ID);
  }
}

// ════════════════════════════════════════════════════════════════
// 4. RAPPEL D'INACTIVITÉ
// ════════════════════════════════════════════════════════════════
export async function recordExpenseActivity(): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_EXPENSE_DATE, new Date().toISOString());
  await scheduleInactivityReminder(3);
}

export async function scheduleInactivityReminder(daysThreshold: number = 3): Promise<void> {
  await cancelInactivityReminder();

  const secondsUntil = daysThreshold * 24 * 60 * 60;

  // ✅ CORRIGÉ — trigger SDK 53+ avec type TIME_INTERVAL
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '👋 On vous attend !',
      body: `Vous n'avez pas enregistré de transaction depuis ${daysThreshold} jours. Gardez le contrôle de vos finances !`,
      data: { type: 'inactivity_reminder', daysThreshold },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntil,
      channelId: 'default',
    },
  });

  await AsyncStorage.setItem(KEYS.INACTIVITY_ID, id);
  console.log(`[Notifications] Rappel inactivité dans ${daysThreshold} jours`);
}

export async function checkInactivity(daysThreshold: number = 3): Promise<void> {
  const lastDateStr = await AsyncStorage.getItem(KEYS.LAST_EXPENSE_DATE);
  if (!lastDateStr) return;

  const diffDays = Math.floor(
    (new Date().getTime() - new Date(lastDateStr).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays >= daysThreshold) {
    await sendLocalNotification({
      title: '👋 Ça fait un moment !',
      body: `Vous n'avez pas saisi de transaction depuis ${diffDays} jours. Vos finances vous attendent !`,
      channelId: 'default',
      data: { type: 'inactivity_reminder', diffDays },
    });
  }
}

export async function cancelInactivityReminder(): Promise<void> {
  const id = await AsyncStorage.getItem(KEYS.INACTIVITY_ID);
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
    await AsyncStorage.removeItem(KEYS.INACTIVITY_ID);
  }
}

// ════════════════════════════════════════════════════════════════
// 5. NOTIFICATIONS COMPARAISON MENSUELLE
// ════════════════════════════════════════════════════════════════
const KEYS_COMPARISON = {
  EXPENSES_UP: 'comparison_notif_expenses_up_',
  REVENUES_DOWN: 'comparison_notif_revenues_down_',
  EXPENSES_DOWN: 'comparison_notif_expenses_down_',
};

const monthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}`;
};

interface ComparisonNotifParams {
  changeDepenses: number;
  changeRevenus: number;
  currentDepenses: number;
  currentRevenus: number;
}

export async function checkComparisonNotifications(params: ComparisonNotifParams): Promise<void> {
  const { changeDepenses, changeRevenus, currentDepenses, currentRevenus } = params;
  const mk = monthKey();

  if (changeDepenses >= 20 && currentDepenses > 0) {
    const key = KEYS_COMPARISON.EXPENSES_UP + mk;
    if (!await AsyncStorage.getItem(key).catch(() => null)) {
      await sendLocalNotification({
        title: '📈 Vos dépenses augmentent !',
        body: `Vous dépensez ${changeDepenses.toFixed(0)}% de plus que le mois dernier.`,
        channelId: 'budget',
        data: { type: 'comparison_expenses_up', change: changeDepenses },
      });
      await AsyncStorage.setItem(key, 'true');
    }
  }

  if (changeRevenus < -10 && currentRevenus > 0) {
    const key = KEYS_COMPARISON.REVENUES_DOWN + mk;
    if (!await AsyncStorage.getItem(key).catch(() => null)) {
      await sendLocalNotification({
        title: '💰 Vos revenus sont en baisse',
        body: `Vos revenus ont diminué de ${Math.abs(changeRevenus).toFixed(0)}% par rapport au mois dernier.`,
        channelId: 'budget',
        data: { type: 'comparison_revenues_down', change: changeRevenus },
      });
      await AsyncStorage.setItem(key, 'true');
    }
  }

  if (changeDepenses < -10 && currentDepenses > 0) {
    const key = KEYS_COMPARISON.EXPENSES_DOWN + mk;
    if (!await AsyncStorage.getItem(key).catch(() => null)) {
      await sendLocalNotification({
        title: '🎉 Bravo, vous économisez !',
        body: `Vos dépenses ont baissé de ${Math.abs(changeDepenses).toFixed(0)}% ce mois-ci !`,
        channelId: 'default',
        data: { type: 'comparison_expenses_down', change: changeDepenses },
      });
      await AsyncStorage.setItem(key, 'true');
    }
  }
}

// ════════════════════════════════════════════════════════════════
// 6. UTILITAIRES
// ════════════════════════════════════════════════════════════════
interface LocalNotificationParams {
  title: string;
  body: string;
  channelId?: string;
  data?: Record<string, any>;
  delaySeconds?: number;
}

async function sendLocalNotification(params: LocalNotificationParams): Promise<string> {
  const { title, body, channelId = 'default', data = {}, delaySeconds } = params;

  return Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: delaySeconds
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: delaySeconds,
          channelId,
        }
      : null,
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Notifications] Toutes les notifications annulées');
}

export function addNotificationListeners(
  onReceive: (notification: Notifications.Notification) => void,
  onResponse: (response: Notifications.NotificationResponse) => void,
) {
  const receiveListener = Notifications.addNotificationReceivedListener(onReceive);
  const responseListener = Notifications.addNotificationResponseReceivedListener(onResponse);
  return () => {
    receiveListener.remove();
    responseListener.remove();
  };
}