import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Bell, BarChart3, TriangleAlert, Info, BellOff } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useTheme } from '../../Context/ThemeContext';
import { useAccessibility } from '../../Context/Accessibility';
import * as NotificationService from '../../services/NotificationService';

// ─── Clés AsyncStorage ────────────────────────────────────────
const PREF_KEYS = {
  ALL: 'pref_notif_all',
  BUDGET: 'pref_notif_budget',
  MONTHLY: 'pref_notif_monthly',
  INACTIVITY: 'pref_notif_inactivity',
};

export default function NotificationScreen() {
  const { colors } = useTheme();
  const { fontFamily } = useAccessibility();
  const router = useRouter();

  const [allEnabled, setAllEnabled] = useState(true);
  const [budgetEnabled, setBudgetEnabled] = useState(true);
  const [monthlyEnabled, setMonthlyEnabled] = useState(true);
  const [inactivityEnabled, setInactivityEnabled] = useState(true);

  // ─── Chargement des préférences ───────────────────────────
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const values = await AsyncStorage.multiGet(Object.values(PREF_KEYS));
        const prefs = Object.fromEntries(values.map(([k, v]) => [k, v !== 'false']));
        setAllEnabled(prefs[PREF_KEYS.ALL] ?? true);
        setBudgetEnabled(prefs[PREF_KEYS.BUDGET] ?? true);
        setMonthlyEnabled(prefs[PREF_KEYS.MONTHLY] ?? true);
        setInactivityEnabled(prefs[PREF_KEYS.INACTIVITY] ?? true);
      } catch (e) {
        console.warn('[NotificationScreen] Erreur chargement préférences:', e);
      }
    };
    loadPrefs();
  }, []);

  // ─── Toggle global ─────────────────────────────────────────
  const toggleAll = async (value: boolean) => {
    setAllEnabled(value);
    setBudgetEnabled(value);
    setMonthlyEnabled(value);
    setInactivityEnabled(value);

    await AsyncStorage.multiSet([
      [PREF_KEYS.ALL, String(value)],
      [PREF_KEYS.BUDGET, String(value)],
      [PREF_KEYS.MONTHLY, String(value)],
      [PREF_KEYS.INACTIVITY, String(value)],
    ]);

    if (!value) {
      await NotificationService.cancelMonthlyReport();
      await NotificationService.cancelInactivityReminder();
      await NotificationService.resetBudgetAlerts();
    } else {
      await NotificationService.scheduleMonthlyReport();
      await NotificationService.scheduleInactivityReminder(3);
    }
  };

  // ─── Toggle Budget ─────────────────────────────────────────
  const toggleBudget = async (value: boolean) => {
    setBudgetEnabled(value);
    await AsyncStorage.setItem(PREF_KEYS.BUDGET, String(value));
    if (!value) await NotificationService.resetBudgetAlerts();
    if (value && !allEnabled) { setAllEnabled(true); await AsyncStorage.setItem(PREF_KEYS.ALL, 'true'); }
  };

  // ─── Toggle Rapport Mensuel ────────────────────────────────
  const toggleMonthly = async (value: boolean) => {
    setMonthlyEnabled(value);
    await AsyncStorage.setItem(PREF_KEYS.MONTHLY, String(value));
    if (!value) await NotificationService.cancelMonthlyReport();
    else await NotificationService.scheduleMonthlyReport();
    if (value && !allEnabled) { setAllEnabled(true); await AsyncStorage.setItem(PREF_KEYS.ALL, 'true'); }
  };

  // ─── Toggle Inactivité ─────────────────────────────────────
  const toggleInactivity = async (value: boolean) => {
    setInactivityEnabled(value);
    await AsyncStorage.setItem(PREF_KEYS.INACTIVITY, String(value));
    if (!value) await NotificationService.cancelInactivityReminder();
    else await NotificationService.scheduleInactivityReminder(3);
    if (value && !allEnabled) { setAllEnabled(true); await AsyncStorage.setItem(PREF_KEYS.ALL, 'true'); }
  };

  // ─── Composant ligne toggle ────────────────────────────────
  const NotifRow = ({
    icon,
    iconBg,
    title,
    description,
    value,
    onToggle,
    disabled = false,
  }: {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    description: string;
    value: boolean;
    onToggle: (v: boolean) => void;
    disabled?: boolean;
  }) => (
    <View style={[
      styles.row,
      { backgroundColor: colors.cardBackground, opacity: disabled ? 0.5 : 1 },
    ]}>
      <View style={styles.leftSide}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.rowTitle, { color: colors.text, fontFamily: fontFamily.bold }]}>
            {title}
          </Text>
          <Text style={[styles.rowDescription, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fontFamily.bold }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Toggle global */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: fontFamily.bold }]}>
            GÉNÉRAL
          </Text>
          <NotifRow
            icon={allEnabled
              ? <Bell size={22} color="#007AFF" strokeWidth={2.5} />
              : <BellOff size={22} color="#8E8E93" strokeWidth={2.5} />
            }
            iconBg={allEnabled ? '#DBEAFE' : colors.border + '50'}
            title="Toutes les notifications"
            description={allEnabled ? 'Toutes les alertes sont activées' : 'Toutes les alertes sont désactivées'}
            value={allEnabled}
            onToggle={toggleAll}
          />
        </View>

        {/* Alertes de compte */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: fontFamily.bold }]}>
            ALERTES DE COMPTE
          </Text>

          <NotifRow
            icon={<TriangleAlert size={22} color="#D93025" strokeWidth={2.5} />}
            iconBg="#FEE2E2"
            title="Suivi du Budget"
            description="Alertes aux seuils de 80% et 100%"
            value={budgetEnabled}
            onToggle={toggleBudget}
            disabled={!allEnabled}
          />

          <NotifRow
            icon={<BarChart3 size={22} color="#1A73E8" strokeWidth={2.5} />}
            iconBg="#DBEAFE"
            title="Bilan Mensuel"
            description="Résumé de vos finances le 1er du mois"
            value={monthlyEnabled}
            onToggle={toggleMonthly}
            disabled={!allEnabled}
          />

          <NotifRow
            icon={<Bell size={22} color="#F57C00" strokeWidth={2.5} />}
            iconBg="#FFEDD5"
            title="Rappels d'activité"
            description="Notification après 3 jours sans saisie"
            value={inactivityEnabled}
            onToggle={toggleInactivity}
            disabled={!allEnabled}
          />
        </View>

        {/* Note d'information */}
        <View style={[styles.infoCard, { backgroundColor: colors.primary + '15' }]}>
          <Info size={18} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary, fontFamily: fontFamily.regular }]}>
            Les notifications sont liées à cet appareil. La désactivation n'affecte pas vos autres téléphones.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 32, color: '#FFF' },
  headerTitle: { fontSize: 20, color: '#FFF' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  leftSide: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  textContainer: { flex: 1 },
  rowTitle: { fontSize: 15, marginBottom: 2 },
  rowDescription: { fontSize: 12 },
  infoCard: {
    flexDirection: 'row',
    margin: 4,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
});