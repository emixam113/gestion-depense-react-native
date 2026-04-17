import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ✅ CHEMINS CORRIGÉS (Un seul ../ pour sortir de tabs et voir components)
import { getWithAuth } from "../../services/Api";
import AddExpense from "../components/AddExpense";
import ExpenseList from '../components/ExpenseList';
import StatsTabsSwipe from '../components/StatsTabsSwipe';
import type { Expense } from '../../Types';

export default function Dashboard() {
  // 🛡️ États initialisés avec des structures vides pour éviter les crashs
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenus: {} as Record<string, number>,
    depenses: {} as Record<string, number>,
    categoryColors: {} as Record<string, string>
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getWithAuth<Expense[]>('/expenses/me');

        // 🛡️ On vérifie que response est bien un tableau avant de boucler
        if (response && Array.isArray(response)) {
          setExpenses(response);

          const dep: Record<string, number> = {};
          const rev: Record<string, number> = {};

          response.forEach(ex => {
            // Sécurité : on vérifie que l'objet ex et sa catégorie existent
            if (!ex) return;
            const amount = Math.abs(parseFloat(ex.amount as any)) || 0;
            const catName = ex.category?.name || 'Autre';

            if (ex.type === 'expense') {
              dep[catName] = (dep[catName] || 0) + amount;
            } else {
              rev[catName] = (rev[catName] || 0) + amount;
            }
          });

          setStats({
            revenus: rev,
            depenses: dep,
            categoryColors: {}
          });
        }
      } catch (err) {
        console.error("❌ Erreur API Dashboard :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#28A745" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* On passe toujours des objets, même vides, pour éviter le crash conversion object */}
          <StatsTabsSwipe
            expenses={expenses || []}
            revenus={stats.revenus || {}}
            depenses={stats.depenses || {}}
            categoryColors={stats.categoryColors || {}}
          />
          <AddExpense />
          <ExpenseList />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  }
});