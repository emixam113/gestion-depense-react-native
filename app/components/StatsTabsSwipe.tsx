import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useTheme } from '../../Context/ThemeContext';
import { useAccessibility } from '../../Context/Accessibility';
import Graph from './Graph';
import type { Expense } from '../../Types';
import { useRouter } from 'expo-router';
import { checkComparisonNotifications } from '../../services/NotificationService';

type StatsTabsSwipeProps = {
    revenus: Record<string, number>;
    depenses: Record<string, number>;
    categoryColors: Record<string, string>;
    expenses: Expense[];
    isPremium?: boolean;
};

const MOIS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export default function StatsTabsSwipe({
    revenus = {},
    depenses = {},
    categoryColors = {},
    expenses = [],
    isPremium = false,
}: StatsTabsSwipeProps) {
    const { colors } = useTheme();
    const { fontFamily } = useAccessibility();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(0);

    const tabs = useMemo(() => ([
        { id: 0, label: 'Répartition', icon: '📊' },
        { id: 1, label: 'Comparaison', icon: '📈' },
        { id: 2, label: 'Tendances', icon: '📉', isPremium: true },
    ]), []);

    // ════════════════════════════════════════════════════════
    // CALCUL COMPARAISON
    // ════════════════════════════════════════════════════════
    const comparison = useMemo(() => {
        // 🛡️ SÉCURITÉ : Empêche le crash si expenses est undefined
        if (!expenses || !Array.isArray(expenses)) {
            return {
                currentDepenses: 0, previousDepenses: 0, changeDepenses: 0,
                currentRevenus: 0, previousRevenus: 0, changeRevenus: 0,
                soldeCourant: 0, soldePrecedent: 0, changeSolde: 0,
                nomMoisCourant: '', nomMoisPrecedent: '', hasData: false,
            };
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const filterByMonth = (month: number, year: number, type: string) =>
            expenses.filter(exp => {
                const d = new Date(exp.date);
                return d.getMonth() === month && d.getFullYear() === year && exp.type === type;
            });

        const sum = (list: Expense[]) =>
            list.reduce((s, e) => s + Math.abs(parseFloat(e.amount)), 0);

        const currentDepenses = sum(filterByMonth(currentMonth, currentYear, 'expense'));
        const previousDepenses = sum(filterByMonth(prevMonth, prevYear, 'expense'));
        const currentRevenus = sum(filterByMonth(currentMonth, currentYear, 'income'));
        const previousRevenus = sum(filterByMonth(prevMonth, prevYear, 'income'));

        const soldeCourant = currentRevenus - currentDepenses;
        const soldePrecedent = previousRevenus - previousDepenses;

        const variation = (current: number, previous: number) =>
            previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

        return {
            currentDepenses, previousDepenses,
            changeDepenses: variation(currentDepenses, previousDepenses),
            currentRevenus, previousRevenus,
            changeRevenus: variation(currentRevenus, previousRevenus),
            soldeCourant, soldePrecedent,
            changeSolde: variation(soldeCourant, soldePrecedent),
            nomMoisCourant: MOIS[currentMonth],
            nomMoisPrecedent: MOIS[prevMonth],
            hasData: currentDepenses > 0 || currentRevenus > 0 || previousDepenses > 0 || previousRevenus > 0,
        };
    }, [expenses]);

    // ════════════════════════════════════════════════════════
    // CALCUL TENDANCES
    // ════════════════════════════════════════════════════════
    const trends = useMemo(() => {
        if (!expenses || !Array.isArray(expenses)) return [];

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const currentByCategory: Record<string, number> = {};
        const previousByCategory: Record<string, number> = {};

        expenses.forEach(exp => {
            if (exp.type !== 'expense') return;
            const d = new Date(exp.date);
            const cat = exp.category?.name || 'Autre';
            const amount = Math.abs(parseFloat(exp.amount));
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear)
                currentByCategory[cat] = (currentByCategory[cat] || 0) + amount;
            else if (d.getMonth() === prevMonth && d.getFullYear() === prevYear)
                previousByCategory[cat] = (previousByCategory[cat] || 0) + amount;
        });

        const result: any[] = [];
        const allCats = new Set([...Object.keys(currentByCategory), ...Object.keys(previousByCategory)]);

        allCats.forEach(cat => {
            const current = currentByCategory[cat] || 0;
            const previous = previousByCategory[cat] || 0;
            if (current === 0 && previous === 0) return;
            const change = previous > 0 ? ((current - previous) / previous) * 100 : 100;
            result.push({ category: cat, change, amount: current });
        });

        return result.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    }, [expenses]);

    // Relance les notifications si les données changent
    useEffect(() => {
        if (comparison.hasData) {
            checkComparisonNotifications({
                changeDepenses: comparison.changeDepenses,
                changeRevenus: comparison.changeRevenus,
                currentDepenses: comparison.currentDepenses,
                currentRevenus: comparison.currentRevenus,
            });
        }
    }, [comparison]);

    // --- Rendu des onglets (Simplifié pour la lisibilité) ---
    return (
        <View style={styles.container}>
            <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id)}
                        style={[styles.tab, activeTab === tab.id && { backgroundColor: colors.primary }]}
                    >
                        <Text style={[styles.tabLabel, { color: activeTab === tab.id ? '#FFF' : colors.textSecondary }]}>
                            {tab.icon} {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.content}>
                {activeTab === 0 && <Graph revenus={revenus} depenses={depenses} categoryColors={categoryColors} />}
                {activeTab === 1 && (
                   <View style={styles.tabContent}>
                       <Text style={{color: colors.text, textAlign: 'center'}}>
                           {comparison.hasData ? `${comparison.nomMoisCourant} vs ${comparison.nomMoisPrecedent}` : "Pas de données"}
                       </Text>
                       {/* Insérer ici tes ComparisonRow et ProgressBar */}
                   </View>
                )}
                {activeTab === 2 && (
                    <View style={styles.tabContent}>
                         <Text style={{color: colors.text}}>Tendances Premium</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginTop: 8 },
    tabsContainer: { flexDirection: 'row', padding: 8, borderRadius: 16, gap: 8, marginBottom: 12 },
    tab: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    tabLabel: { fontSize: 12, fontWeight: '600' },
    content: { minHeight: 200 },
    tabContent: { padding: 10 }
});