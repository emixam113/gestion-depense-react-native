import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ On utilise sendWithAuth qui est présent dans ton Api.tsx
import { getWithAuth, getCategories, sendWithAuth } from "../../services/Api";
import AddExpense from "../../components/AddExpense";
import ExpenseList from '../../components/ExpenseList';
import StatsTabsSwipe from '../../components/StatsTabsSwipe';
import CategoryList from '../../components/CategoryList';
import AddCategory from '../../components/AddCategory';
import type { Expense, Category } from '../../Types';

import { useTheme } from '../../Context/ThemeContext';
import { useAccessibility } from '../../Context/Accessibility';

export default function Dashboard() {
  const router = useRouter();
  const { colors, isDark, setThemePreference } = useTheme();
  const { fontFamily, toggleFont, accessibleFont } = useAccessibility();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState({ revenus: {}, depenses: {} });

  const fetchData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const storedToken = await AsyncStorage.getItem("userToken");
      setToken(storedToken);

      const profile = await getWithAuth<any>("/auth/profile");
      if (profile) {
        setUserName(profile.firstName || 'Utilisateur');
        setTotalBalance(profile.totalBalance || 0);
      }

      const cats = await getCategories();
      setCategories(Array.isArray(cats) ? cats : []);

      const response = await getWithAuth<Expense[]>('/expenses/me');
      if (response && Array.isArray(response)) {
        setExpenses(response);
        const rev: any = {}; const dep: any = {};
        response.forEach(ex => {
          const amount = Math.abs(parseFloat(ex.amount as any)) || 0;
          const catName = ex.category?.name || 'Autre';
          if (ex.type === 'expense') dep[catName] = (dep[catName] || 0) + amount;
          else rev[catName] = (rev[catName] || 0) + amount;
        });
        setStats({ revenus: rev, depenses: dep });
      }
    } catch (err) {
      console.error("❌ Erreur FetchData :", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ✅ UTILISATION DE SENDWITHAUTH (PRESENT DANS TON API.TSX)
  const handleAddExpense = async (newExpenseData: any) => {
    console.log("🚀 Envoi via sendWithAuth :", newExpenseData);
    try {
      // On spécifie la méthode 'POST' car sendWithAuth est générique
      await sendWithAuth('/expenses', 'POST', newExpenseData);
      console.log("✅ Succès !");
      await fetchData(false);
    } catch (err: any) {
      console.error("❌ Erreur API :", err.message);
      Alert.alert("Erreur", "Impossible d'ajouter la dépense.");
      throw err;
    }
  };

  const renderHeader = () => (
    <View style={{ backgroundColor: colors.background }}>
      <View style={styles.headerRow}>
        <Text style={[styles.welcomeText, { fontFamily: fontFamily.bold, color: colors.text }]}>Bonjour, {userName} 👋</Text>
        <View style={styles.welcomeRightActions}>
          <TouchableOpacity onPress={() => setThemePreference(isDark ? 'light' : 'dark')} style={styles.actionBtn}>
            <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleFont} style={[styles.accessibilityToggleBtn, { backgroundColor: accessibleFont ? colors.primary : colors.border }]}>
             <Ionicons name="eye-outline" size={20} color={accessibleFont ? "#FFF" : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('../screens/Settings')} style={styles.actionBtn}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.balanceBox}>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Solde actuel</Text>
        <Text style={[styles.balanceValue, { color: colors.text, fontFamily: fontFamily.bold }]}>
          {totalBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
        </Text>
      </View>

      <StatsTabsSwipe revenus={stats.revenus} depenses={stats.depenses} expenses={expenses} totalBalance={totalBalance} />

      <AddExpense onAdd={handleAddExpense} categories={categories} />

      <View style={styles.sectionTitleContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fontFamily.bold }]}>Transactions récentes</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => <ExpenseList expenses={[item]} onDeleteSuccess={() => fetchData(false)} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(false)} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 20 },
  welcomeText: { fontSize: 18 },
  welcomeRightActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8, marginLeft: 5 },
  accessibilityToggleBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginLeft: 5 },
  balanceBox: { paddingHorizontal: 20, marginVertical: 20 },
  balanceLabel: { fontSize: 13, textTransform: 'uppercase' },
  balanceValue: { fontSize: 36, marginTop: 4 },
  sectionTitleContainer: { paddingHorizontal: 20, marginTop: 25, marginBottom: 10 },
  sectionTitle: { fontSize: 20 }
});