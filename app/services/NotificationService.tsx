import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Configuration globale des notifications ─────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Clés AsyncStorage ───────────────────────────────────────────────
const KEYS = {
  LAST_EXPENSE_DATE: 'last_expense_date',
  BUDGET_ALERT_SENT: 'budget_alert_sent_', // + categoryId
  MONTHLY_REPORT_ID: 'monthly_report_notif_id',
  INACTIVITY_ID: 'inactivity_notif_id',
  PUSH_TOKEN: 'push_token',
};

// ════════════════════════════════════════════════════════════════
// 1. INITIALISATION & PERMISSIONS
// ════════════════════════════════════════════════════════════════

/**
 * À appeler au démarrage de l'app dans _layout.tsx
 * Demande les permissions et retourne le token push
 */
export async function initNotifications(): Promise<string | null> {
  // Les notifications ne fonctionnent pas sur simulateur
  if (!Device.isDevice) {
    console.warn('[Notifications] Simulateur détecté — notifications désactivées');
    return null;
  }

  // Vérifier / demander les permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission refusée par l\'utilisateur');
    return null;
  }

  // Canal Android obligatoire
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

  // Récupérer et sauvegarder le token push Expo
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    await AsyncStorage.setItem(KEYS.PUSH_TOKEN, token);
    console.log('[Notifications] Token push:', token);
    return token;
  } catch (e) {
    console.error('[Notifications] Erreur token:', e);
    return null;
  }
}

/**
 * Récupérer le token push sauvegardé
 */
export async function getPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.PUSH_TOKEN);
}

// ════════════════════════════════════════════════════════════════
// 2. ALERTES BUDGET (80% et 100%)
// ════════════════════════════════════════════════════════════════

interface BudgetAlertParams {
  categoryName: string;   // Ex: "Alimentation"
  categoryId: string;     // Ex: "alimentation"
  spent: number;          // Montant dépensé
  budget: number;         // Budget max défini
}

/**
 * Vérifie si une alerte budget doit être envoyée
 * À appeler chaque fois qu'une dépense est ajoutée
 */
export async function checkBudgetAlert(params: BudgetAlertParams): Promise<void> {
  const { categoryName, categoryId, spent, budget } = params;
  if (!budget || budget <= 0) return;

  const percentage = (spent / budget) * 100;

  // ── Alerte 80% ────────────────────────────────────────────────
  if (percentage >= 80 && percentage < 100) {
    const key80 = KEYS.BUDGET_ALERT_SENT + categoryId + '_80';
    const alreadySent = await AsyncStorage.getItem(key80);

    if (!alreadySent) {
      await sendLocalNotification({
        title: `⚠️ Budget ${categoryName} à 80%`,
        body: `Vous avez dépensé ${spent.toFixed(2)} € sur ${budget.toFixed(2)} € prévus. Faites attention !`,
        channelId: 'budget',
        data: { type: 'budget_alert', categoryId, level: 80 },
      });
      await AsyncStorage.setItem(key80, 'true');
    }
  }

  // ── Alerte 100% (dépassement) ─────────────────────────────────
  if (percentage >= 100) {
    const key100 = KEYS.BUDGET_ALERT_SENT + categoryId + '_100';
    const alreadySent = await AsyncStorage.getItem(key100);

    if (!alreadySent) {
      await sendLocalNotification({
        title: `🚨 Budget ${categoryName} dépassé !`,
        body: `Vous avez dépensé ${spent.toFixed(2)} € pour un budget de ${budget.toFixed(2)} €. Dépassement de ${(spent - budget).toFixed(2)} €.`,
        channelId: 'budget',
        data: { type: 'budget_alert', categoryId, level: 100 },
      });
      await AsyncStorage.setItem(key100, 'true');
    }
  }
}

/**
 * Réinitialiser les alertes budget en début de mois
 * À appeler le 1er de chaque mois
 */
export async function resetBudgetAlerts(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const budgetKeys = allKeys.filter(k => k.startsWith(KEYS.BUDGET_ALERT_SENT));
  if (budgetKeys.length > 0) {
    await AsyncStorage.multiRemove(budgetKeys);
  }
  console.log('[Notifications] Alertes budget réinitialisées');
}

// ════════════════════════════════════════════════════════════════
// 3. RAPPORT MENSUEL AUTOMATIQUE
// ════════════════════════════════════════════════════════════════

interface MonthlyReportParams {
  totalDepenses: number;
  totalRevenus: number;
  solde: number;
  topCategorie: string;    // Catégorie avec le plus de dépenses
  variationVsMoisPrecedent: number; // En % (positif = plus de dépenses)
}

/**
 * Planifie le rapport mensuel pour le 1er du mois prochain à 9h00
 * À appeler une seule fois (ou après chaque rapport envoyé)
 */
export async function scheduleMonthlyReport(params: MonthlyReportParams): Promise<void> {
  // Annuler l'ancien rapport planifié
  await cancelMonthlyReport();

  // Calculer la date du 1er du mois prochain à 9h00
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);

  const variation = params.variationVsMoisPrecedent;
  const variationText = variation > 0
    ? `+${variation.toFixed(0)}% vs mois dernier 📈`
    : variation < 0
    ? `${variation.toFixed(0)}% vs mois dernier 📉`
    : 'Stable vs mois dernier';

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Votre bilan du mois est prêt !',
      body: `Dépenses : ${params.totalDepenses.toFixed(2)} € | Revenus : ${params.totalRevenus.toFixed(2)} € | ${variationText}`,
      data: {
        type: 'monthly_report',
        totalDepenses: params.totalDepenses,
        totalRevenus: params.totalRevenus,
        solde: params.solde,
        topCategorie: params.topCategorie,
      },
      sound: true,
    },
    trigger: {
      date: nextMonth,
      channelId: 'rapport',
    },
  });

  await AsyncStorage.setItem(KEYS.MONTHLY_REPORT_ID, id);
  console.log(`[Notifications] Rapport mensuel planifié pour le ${nextMonth.toLocaleDateString('fr-FR')}`);
}

/**
 * Envoyer un rapport mensuel immédiatement (pour tester ou fin de mois)
 */
export async function sendMonthlyReportNow(params: MonthlyReportParams): Promise<void> {
  const variation = params.variationVsMoisPrecedent;
  const variationText = variation > 0
    ? `+${variation.toFixed(0)}% vs mois dernier`
    : variation < 0
    ? `${variation.toFixed(0)}% vs mois dernier`
    : 'Stable vs mois dernier';

  await sendLocalNotification({
    title: '📊 Votre bilan du mois est prêt !',
    body: `Dépenses : ${params.totalDepenses.toFixed(2)} € — Revenus : ${params.totalRevenus.toFixed(2)} € — ${variationText}. Top catégorie : ${params.topCategorie}.`,
    channelId: 'rapport',
    data: { type: 'monthly_report', ...params },
  });
}

/**
 * Annuler le rapport mensuel planifié
 */
export async function cancelMonthlyReport(): Promise<void> {
  const id = await AsyncStorage.getItem(KEYS.MONTHLY_REPORT_ID);
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
    await AsyncStorage.removeItem(KEYS.MONTHLY_REPORT_ID);
  }
}

// ════════════════════════════════════════════════════════════════
// 4. RAPPEL D'INACTIVITÉ (pas de saisie depuis X jours)
// ════════════════════════════════════════════════════════════════

/**
 * Enregistrer la date de la dernière saisie
 * À appeler chaque fois qu'une dépense ou revenu est ajouté
 */
export async function recordExpenseActivity(): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_EXPENSE_DATE, new Date().toISOString());
  // Reprogrammer le rappel d'inactivité à chaque saisie
  await scheduleInactivityReminder(3); // 3 jours par défaut
}

/**
 * Planifier un rappel si pas de saisie depuis X jours
 * À appeler au démarrage de l'app et après chaque saisie
 */
export async function scheduleInactivityReminder(daysThreshold: number = 3): Promise<void> {
  // Annuler l'ancien rappel
  await cancelInactivityReminder();

  // Planifier dans X jours à 10h00
  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + daysThreshold);
  triggerDate.setHours(10, 0, 0, 0);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '👋 On vous attend !',
      body: `Vous n'avez pas enregistré de transaction depuis ${daysThreshold} jours. Gardez le contrôle de vos finances !`,
      data: { type: 'inactivity_reminder', daysThreshold },
      sound: true,
    },
    trigger: {
      date: triggerDate,
      channelId: 'default',
    },
  });

  await AsyncStorage.setItem(KEYS.INACTIVITY_ID, id);
  console.log(`[Notifications] Rappel inactivité planifié dans ${daysThreshold} jours`);
}

/**
 * Vérifier si l'utilisateur est inactif et envoyer une notif immédiate si besoin
 * À appeler au démarrage de l'app
 */
export async function checkInactivity(daysThreshold: number = 3): Promise<void> {
  const lastDateStr = await AsyncStorage.getItem(KEYS.LAST_EXPENSE_DATE);
  if (!lastDateStr) return;

  const lastDate = new Date(lastDateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays >= daysThreshold) {
    await sendLocalNotification({
      title: '👋 Ça fait un moment !',
      body: `Vous n'avez pas saisi de transaction depuis ${diffDays} jours. Vos finances vous attendent !`,
      channelId: 'default',
      data: { type: 'inactivity_reminder', diffDays },
    });
  }
}

/**
 * Annuler le rappel d'inactivité planifié
 */
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
  EXPENSES_UP: 'comparison_notif_expenses_up_',     // + YYYY-MM
  REVENUES_DOWN: 'comparison_notif_revenues_down_', // + YYYY-MM
  EXPENSES_DOWN: 'comparison_notif_expenses_down_', // + YYYY-MM
};

// Clé unique par mois pour éviter le spam
const monthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}`;
};

interface ComparisonNotifParams {
  changeDepenses: number;  // variation % dépenses
  changeRevenus: number;   // variation % revenus
  currentDepenses: number;
  currentRevenus: number;
}

/**
 * Vérifie les 3 situations et envoie les notifications appropriées
 * À appeler dans ComparisonTab au montage (useEffect)
 * Une seule notification par situation par mois
 */
export async function checkComparisonNotifications(
  params: ComparisonNotifParams
): Promise<void> {
  const { changeDepenses, changeRevenus, currentDepenses, currentRevenus } = params;
  const mk = monthKey();

  // ── 1. Dépenses +20% vs mois dernier ──────────────────────────────
  if (changeDepenses >= 20 && currentDepenses > 0) {
    const key = KEYS_COMPARISON.EXPENSES_UP + mk;
    const alreadySent = await AsyncStorage.getItem(key).catch(() => null);

    if (!alreadySent) {
      await sendLocalNotification({
        title: '📈 Vos dépenses augmentent !',
        body: `Vous avez dépensé ${changeDepenses.toFixed(0)}% de plus que le mois dernier. Pensez à revoir votre budget.`,
        channelId: 'budget',
        data: { type: 'comparison_expenses_up', change: changeDepenses },
      });
      await AsyncStorage.setItem(key, 'true');
    }
  }

  // ── 2. Revenus en baisse ce mois ───────────────────────────────────
  if (changeRevenus < -10 && currentRevenus > 0) {
    const key = KEYS_COMPARISON.REVENUES_DOWN + mk;
    const alreadySent = await AsyncStorage.getItem(key).catch(() => null);

    if (!alreadySent) {
      await sendLocalNotification({
        title: '💰 Vos revenus sont en baisse',
        body: `Vos revenus ont diminué de ${Math.abs(changeRevenus).toFixed(0)}% par rapport au mois dernier.`,
        channelId: 'budget',
        data: { type: 'comparison_revenues_down', change: changeRevenus },
      });
      await AsyncStorage.setItem(key, 'true');
    }
  }

  // ── 3. Bonne nouvelle : dépenses en baisse ─────────────────────────
  if (changeDepenses < -10 && currentDepenses > 0) {
    const key = KEYS_COMPARISON.EXPENSES_DOWN + mk;
    const alreadySent = await AsyncStorage.getItem(key).catch(() => null);

    if (!alreadySent) {
      await sendLocalNotification({
        title: '🎉 Bravo, vous économisez !',
        body: `Vos dépenses ont baissé de ${Math.abs(changeDepenses).toFixed(0)}% ce mois-ci. Continuez comme ça !`,
        channelId: 'default',
        data: { type: 'comparison_expenses_down', change: changeDepenses },
      });
      await AsyncStorage.setItem(key, 'true');
    }
  }
}

// ════════════════════════════════════════════════════════════════
// 5. UTILITAIRES INTERNES
// ════════════════════════════════════════════════════════════════

interface LocalNotificationParams {
  title: string;
  body: string;
  channelId?: string;
  data?: Record<string, any>;
  delaySeconds?: number;
}

/**
 * Envoyer une notification locale immédiate (ou avec délai)
 */
async function sendLocalNotification(params: LocalNotificationParams): Promise<string> {
  const { title, body, channelId = 'default', data = {}, delaySeconds } = params;

  return Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: delaySeconds
      ? { seconds: delaySeconds, channelId }
      : null, // null = immédiat
  });
}

/**
 * Annuler TOUTES les notifications planifiées
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[Notifications] Toutes les notifications annulées');
}

/**
 * Écouter les notifications reçues (à brancher dans _layout.tsx)
 */
export function addNotificationListeners(
  onReceive: (notification: Notifications.Notification) => void,
  onResponse: (response: Notifications.NotificationResponse) => void,
) {
  const receiveListener = Notifications.addNotificationReceivedListener(onReceive);
  const responseListener = Notifications.addNotificationResponseReceivedListener(onResponse);

  // Retourner une fonction de cleanup
  return () => {
    receiveListener.remove();
    responseListener.remove();
  };
}