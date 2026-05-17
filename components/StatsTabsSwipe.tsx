import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { useTheme } from '../Context/ThemeContext';
import { useAccessibility } from '../Context/Accessibility';
import Graph from './Graph';
// ✅ Import du graphique de tendance à la place du lock
import SubscriptionTrendChart from './PremiumTrendChart';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

import { getComparisonData } from '../services/Api';
import { checkComparisonNotifications } from '../services/NotificationService';

type StatsTabsSwipeProps = {
    revenus?: Record<string, number>;
    depenses?: Record<string, number>;
    categoryColors?: Record<string, string>;
    isPremium?: boolean;
    refreshTrigger?: number;
    expenses?: any[]; // ✅ Ajout des expenses pour le graphique
};

const MOIS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export default function StatsTabsSwipe({
    revenus = {},
    depenses = {},
    categoryColors = {},
    isPremium = false,
    refreshTrigger = 0,
    expenses = [], // ✅ On récupère les data
}: StatsTabsSwipeProps) {
    const { colors } = useTheme();
    const { fontFamily } = useAccessibility();
    const [activeTab, setActiveTab] = useState(0);

    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await getComparisonData();
            setStats(data);

            if (data && data.variations) {
                checkComparisonNotifications({
                    changeDepenses: data.variations.expense || 0,
                    changeRevenus: data.variations.income || 0,
                    currentDepenses: data.currentMonth?.totalExpense || 0,
                    currentRevenus: data.currentMonth?.totalIncome || 0,
                });
            }
        } catch (error) {
            console.error("Erreur API Stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadStats();
        }, [])
    );

    useEffect(() => {
        if (refreshTrigger > 0) {
            loadStats();
        }
    }, [refreshTrigger]);

    const currentMonthIdx = new Date().getMonth();
    const prevMonthIdx = currentMonthIdx === 0 ? 11 : currentMonthIdx - 1;

    const renderRow = (label: string, current: number, previous: number, variation: number, barColor: string) => {
        const currentAbs = Math.abs(current);
        const previousAbs = Math.max(Math.abs(previous), 1);
        const isUp = variation > 0;
        const statusColor = label === "Dépenses" ? (isUp ? '#FF5252' : '#4CAF50') : (isUp ? '#4CAF50' : '#FF5252');
        const progress = Math.min((currentAbs / previousAbs) * 100, 100);

        return (
            <View style={styles.row}>
                <View style={styles.rowHeader}>
                    <Text style={[styles.rowLabel, { color: colors.text, fontFamily: fontFamily.bold }]}>{label}</Text>
                    <View style={styles.badge}>
                        {isUp ? <ArrowUpRight size={14} color={statusColor} /> : <ArrowDownRight size={14} color={statusColor} />}
                        <Text style={[styles.badgeText, { color: statusColor }]}>
                            {Math.abs(variation).toFixed(1)}%
                        </Text>
                    </View>
                </View>
                <View style={styles.barContainer}>
                    <View style={[styles.barBg, { backgroundColor: colors.background }]}>
                        <View style={[styles.barFill, { width: `${progress}%`, backgroundColor: barColor }]} />
                    </View>
                    <Text style={[styles.amount, { color: colors.text, fontFamily: fontFamily.bold }]}>
                        {currentAbs.toFixed(0)}€
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.cardBackground || colors.card }]}>
            <View style={styles.tabsContainer}>
                {[
                    { id: 0, label: 'Graph', icon: <Wallet size={20} color={activeTab === 0 ? '#FFF' : colors.text} /> },
                    { id: 1, label: 'Comparaison', icon: <ArrowUpRight size={20} color={activeTab === 1 ? '#FFF' : colors.text} /> },
                    { id: 2, label: 'Prévisions', icon: <ArrowDownRight size={20} color={activeTab === 2 ? '#FFF' : colors.text} /> }
                ].map((tab) => (
                    <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)} style={styles.tabItem}>
                        <View style={[styles.iconBox, { backgroundColor: activeTab === tab.id ? colors.primary : colors.background }]}>
                            {tab.icon}
                        </View>
                        <Text style={[styles.tabLabel, { color: activeTab === tab.id ? colors.primary : colors.textSecondary }]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.content}>
                {activeTab === 0 && <Graph revenus={revenus} depenses={depenses} categoryColors={categoryColors} />}

                {activeTab === 1 && (
                    <View>
                        <Text style={[styles.comparisonTitle, { color: colors.text, fontFamily: fontFamily.bold }]}>
                            {MOIS[prevMonthIdx]} vs {MOIS[currentMonthIdx]}
                        </Text>

                        {loading ? (
                            <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 20 }} />
                        ) : (
                            <>
                                {renderRow(
                                    "Dépenses",
                                    stats?.currentMonth?.totalExpense || 0,
                                    stats?.previousMonth?.totalExpense || 0,
                                    stats?.variations?.expense || 0,
                                    '#FF6384'
                                )}
                                {renderRow(
                                    "Revenus",
                                    stats?.currentMonth?.totalIncome || 0,
                                    stats?.previousMonth?.totalIncome || 0,
                                    stats?.variations?.income || 0,
                                    '#4BC0C0'
                                )}

                                <View style={[styles.footer, { borderTopColor: colors.background }]}>
                                    <View style={styles.footerLeft}>
                                        <Wallet size={16} color={colors.textSecondary} />
                                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Solde actuel</Text>
                                    </View>
                                    <Text style={[styles.solde, {
                                        color: (stats?.currentMonth?.balance || 0) >= 0 ? '#4BC0C0' : '#FF6384',
                                        fontFamily: fontFamily.bold
                                    }]}>
                                        {(stats?.currentMonth?.balance || 0).toFixed(2)}€
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                )}

                {/* ✅ DÉVERROUILLÉ : On affiche le graphique à la place du PremiumLockView */}
                {activeTab === 2 && (
                    <View style={{ flex: 1, minHeight: 250 }}>
                        <SubscriptionTrendChart
                            expenses={expenses}
                            colors={colors}
                            fontFamily={fontFamily}
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { margin: 20, borderRadius: 24, padding: 20, elevation: 4 },
    tabsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 25 },
    tabItem: { alignItems: 'center' },
    iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    tabLabel: { fontSize: 10, fontWeight: '600' },
    content: { minHeight: 240 },
    comparisonTitle: { textAlign: 'center', fontSize: 16, marginBottom: 20 },
    row: { marginBottom: 18 },
    rowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    rowLabel: { fontSize: 13 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    badgeText: { fontSize: 11, fontWeight: 'bold' },
    barContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    barBg: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 4 },
    amount: { fontSize: 13, minWidth: 50, textAlign: 'right' },
    footer: { marginTop: 10, paddingTop: 15, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    solde: { fontSize: 18 }
});