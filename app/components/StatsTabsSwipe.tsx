import React, { useState, useMemo, useEffect } from 'react';
import{
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { useTheme } from '../Context/ThemeContext';
import { useAccessibility } from '../Context/Accessibility';
import Graph from './Graph';
import type { Expense } from '../Types';
import { useRouter } from 'expo-router';
import {checkComparisonNotifications} from '../services/NotificationService';

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
    revenus,
    depenses,
    categoryColors,
    expenses,
    isPremium = false,
}: StatsTabsSwipeProps) {
    const { colors } = useTheme();
    const { fontFamily } = useAccessibility();
    const router = useRouter();

    const tabs = useMemo(() => ([
        { id: 0, label: 'Répartition', icon: '📊' },
        { id: 1, label: 'Comparaison', icon: '📈' },
        { id: 2, label: 'Tendances', icon: '📉', isPremium: true },
    ]), []);

    const [activeTab, setActiveTab] = useState(0);

    // ════════════════════════════════════════════════════════
    // CALCUL COMPARAISON — dépenses + revenus + solde net
    // ════════════════════════════════════════════════════════
    const comparison = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const filterByMonth = (month: number, year: number, type: string) =>
            expenses.filter(exp => {
                const d = new Date(exp.date);
                return d.getMonth() === month &&
                    d.getFullYear() === year &&
                    exp.type === type;
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
            previous > 0 ? ((current - previous) / previous) * 100
            : current > 0 ? 100 : 0;

        return {
            currentDepenses, previousDepenses,
            changeDepenses: variation(currentDepenses, previousDepenses),
            currentRevenus, previousRevenus,
            changeRevenus: variation(currentRevenus, previousRevenus),
            soldeCourant, soldePrecedent,
            changeSolde: variation(soldeCourant, soldePrecedent),
            nomMoisCourant: MOIS[currentMonth],
            nomMoisPrecedent: MOIS[prevMonth],
            hasData: currentDepenses > 0 || currentRevenus > 0 ||
                     previousDepenses > 0 || previousRevenus > 0,
        };
    }, [expenses]);

    // ════════════════════════════════════════════════════════
    // NOTIFICATIONS COMPARAISON — déclenchées une fois/mois
    // ════════════════════════════════════════════════════════
    useEffect(() => {
        if (!comparison.hasData) return;

        checkComparisonNotifications({
            changeDepenses: comparison.changeDepenses,
            changeRevenus: comparison.changeRevenus,
            currentDepenses: comparison.currentDepenses,
            currentRevenus: comparison.currentRevenus,
        });
    }, [comparison]);

    // ════════════════════════════════════════════════════════
    // CALCUL TENDANCES PAR CATÉGORIE
    // ════════════════════════════════════════════════════════
    const trends = useMemo(() => {
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

        const emojiFor = (name: string) => {
            const n = name.toLowerCase();
            if (n.includes('aliment') || n.includes('food')) return '🍕';
            if (n.includes('transport')) return '🚗';
            if (n.includes('loisir') || n.includes('divertissement')) return '🎮';
            if (n.includes('logement') || n.includes('loyer')) return '🏠';
            if (n.includes('shopping') || n.includes('vêtement')) return '👕';
            if (n.includes('santé') || n.includes('médical')) return '🏥';
            if (n.includes('informatique')) return '💻';
            if (n.includes('sport')) return '🏋️';
            if (n.includes('courses')) return '🛒';
            return '💰';
        };

        const result: { category: string; change: number; amount: number; emoji: string }[] = [];
        const allCats = new Set([
            ...Object.keys(currentByCategory),
            ...Object.keys(previousByCategory),
        ]);

        allCats.forEach(cat => {
            const current = currentByCategory[cat] || 0;
            const previous = previousByCategory[cat] || 0;
            if (current === 0) return;
            const change = previous > 0 ? ((current - previous) / previous) * 100 : 100;
            result.push({ category: cat, change, amount: current, emoji: emojiFor(cat) });
        });

        return result.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    }, [expenses]);

    // ════════════════════════════════════════════════════════
    // ONGLET 1 — RÉPARTITION
    // ════════════════════════════════════════════════════════
    const RepartitionTab = () => (
        <View>
            <Graph revenus={revenus} depenses={depenses} categoryColors={categoryColors} />
        </View>
    );

    // ════════════════════════════════════════════════════════
    // ONGLET 2 — COMPARAISON MOIS / MOIS
    // ════════════════════════════════════════════════════════
    const ComparisonRow = ({
        label, emoji, current, previous, change, isPositiveGood,
    }: {
        label: string; emoji: string; current: number; previous: number;
        change: number; isPositiveGood: boolean;
    }) => {
        const isUp = change > 0;
        const isGood = isPositiveGood ? isUp : !isUp;
        const badgeColor = change === 0
            ? colors.textSecondary
            : isGood ? '#16A34A' : '#DC2626';

        return (
            <View style={[styles.comparisonRow, { borderBottomColor: colors.border }]}>
                <View style={styles.comparisonLeft}>
                    <Text style={styles.comparisonEmoji}>{emoji}</Text>
                    <Text style={[styles.comparisonLabel,
                        { fontFamily: fontFamily.regular, color: colors.textSecondary }]}>
                        {label}
                    </Text>
                </View>
                <View style={styles.comparisonCenter}>
                    <Text style={[styles.oldAmount,
                        { fontFamily: fontFamily.regular, color: colors.textSecondary }]}>
                        {previous > 0 ? `${previous.toFixed(0)} €` : '—'}
                    </Text>
                    <Text style={[styles.arrow, { color: colors.textSecondary }]}> → </Text>
                    <Text style={[styles.newAmount,
                        { fontFamily: fontFamily.bold, color: colors.text }]}>
                        {current.toFixed(0)} €
                    </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badgeColor + '22' }]}>
                    <Text style={[styles.badgeText,
                        { color: badgeColor, fontFamily: fontFamily.bold }]}>
                        {change === 0
                            ? '= 🎯'
                            : isUp
                            ? `+${change.toFixed(0)}% ${isGood ? '✅' : '⚠️'}`
                            : `${change.toFixed(0)}% ${isGood ? '✅' : '⚠️'}`}
                    </Text>
                </View>
            </View>
        );
    };

    const ProgressBar = ({
        labelLeft, labelRight, current, previous, color,
    }: {
        labelLeft: string; labelRight: string;
        current: number; previous: number; color: string;
    }) => {
        const max = Math.max(current, previous, 1);
        return (
            <View style={styles.progressWrapper}>
                <View style={styles.progressLabels}>
                    <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                        {labelLeft}
                    </Text>
                    <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                        {labelRight}
                    </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressFill, {
                        width: `${(previous / max) * 100}%`,
                        backgroundColor: color + '55',
                    }]} />
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressFill, {
                        width: `${(current / max) * 100}%`,
                        backgroundColor: color,
                    }]} />
                </View>
            </View>
        );
    };

    const ComparisonTab = () => {
        // Déclencher les notifications de comparaison au chargement
        useEffect(() => {
            if (comparison.hasData) {
                checkComparisonNotifications({
                    changeDepenses: comparison.changeDepenses,
                    changeRevenus: comparison.changeRevenus,
                    currentDepenses: comparison.currentDepenses,
                    currentRevenus: comparison.currentRevenus,
                });
            }
        }, []);

        if (!comparison.hasData) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyMessage,
                        { fontFamily: fontFamily.semiBold, color: colors.text }]}>
                        📊 Pas encore de données
                    </Text>
                    <Text style={[styles.emptyHint,
                        { fontFamily: fontFamily.regular, color: colors.textSecondary }]}>
                        Ajoutez des transactions pour voir les comparaisons mois par mois
                    </Text>
                </View>
            );
        }

        const getTip = () => {
            const { changeDepenses, changeRevenus, changeSolde,
                    currentDepenses, currentRevenus } = comparison;
            if (currentDepenses === 0 && currentRevenus === 0)
                return { emoji: '💡', text: "Aucune transaction ce mois-ci. Commencez à saisir vos dépenses !", good: null };
            if (changeDepenses < 0 && changeRevenus >= 0)
                return { emoji: '🌟', text: "Excellent ! Vos dépenses baissent et vos revenus se maintiennent.", good: true };
            if (changeRevenus > 0 && changeDepenses <= 0)
                return { emoji: '🎯', text: "Parfait ! Vous gagnez plus et dépensez moins ce mois-ci.", good: true };
            if (changeDepenses > 15 && changeRevenus <= 0)
                return { emoji: '⚠️', text: `Attention : vos dépenses ont augmenté de ${changeDepenses.toFixed(0)}% sans hausse de revenus.`, good: false };
            if (changeSolde > 0)
                return { emoji: '📈', text: "Votre solde net s'améliore ce mois-ci. Continuez ainsi !", good: true };
            if (changeSolde < -10)
                return { emoji: '💡', text: "Votre solde net baisse ce mois-ci. Identifiez les postes à réduire.", good: false };
            return { emoji: '🎯', text: "Votre budget est stable ce mois-ci.", good: null };
        };

        const tip = getTip();
        const tipBg = tip.good === true ? '#16A34A20'
            : tip.good === false ? '#DC262615'
            : colors.surface;

        return (
            <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.tabTitle,
                    { fontFamily: fontFamily.bold, color: colors.text }]}>
                    📊 {comparison.nomMoisCourant} vs {comparison.nomMoisPrecedent}
                </Text>

                {/* Tableau comparaison */}
                <View style={[styles.mainCard, { backgroundColor: colors.surface }]}>
                    <ComparisonRow
                        label="Dépenses" emoji="💸"
                        current={comparison.currentDepenses}
                        previous={comparison.previousDepenses}
                        change={comparison.changeDepenses}
                        isPositiveGood={false}
                    />
                    <ComparisonRow
                        label="Revenus" emoji="💰"
                        current={comparison.currentRevenus}
                        previous={comparison.previousRevenus}
                        change={comparison.changeRevenus}
                        isPositiveGood={true}
                    />
                    <ComparisonRow
                        label="Solde net" emoji="🏦"
                        current={comparison.soldeCourant}
                        previous={comparison.soldePrecedent}
                        change={comparison.changeSolde}
                        isPositiveGood={true}
                    />
                </View>

                {/* Barres visuelles */}
                <View style={[styles.barsCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.barsTitle,
                        { color: colors.text, fontFamily: fontFamily.semiBold }]}>
                        Visualisation
                    </Text>
                    <Text style={[styles.barsLegend, { color: colors.textSecondary }]}>
                        Barre claire = {comparison.nomMoisPrecedent} · Barre pleine = {comparison.nomMoisCourant}
                    </Text>
                    <ProgressBar
                        labelLeft="💸 Dépenses"
                        labelRight={`${comparison.currentDepenses.toFixed(0)} €`}
                        current={comparison.currentDepenses}
                        previous={comparison.previousDepenses}
                        color="#DC2626"
                    />
                    <View style={{ height: 12 }} />
                    <ProgressBar
                        labelLeft="💰 Revenus"
                        labelRight={`${comparison.currentRevenus.toFixed(0)} €`}
                        current={comparison.currentRevenus}
                        previous={comparison.previousRevenus}
                        color="#16A34A"
                    />
                </View>

                {/* Conseil contextuel */}
                <View style={[styles.tipCard, { backgroundColor: tipBg }]}>
                    <Text style={styles.tipEmoji}>{tip.emoji}</Text>
                    <Text style={[styles.tipText,
                        { fontFamily: fontFamily.regular, color: colors.text }]}>
                        {tip.text}
                    </Text>
                </View>
            </ScrollView>
        );
    };

    // ════════════════════════════════════════════════════════
    // ONGLET 3 — TENDANCES (Premium)
    // ════════════════════════════════════════════════════════
    const PremiumLockOverlay = () => (
        <View style={[styles.lockContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.lockCard,
                { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                <Text style={styles.lockIcon}>⭐</Text>
                <Text style={[styles.lockTitle,
                    { fontFamily: fontFamily.semiBold, color: colors.text }]}>
                    Analyse des Tendances
                </Text>
                <Text style={[styles.lockDescription,
                    { fontFamily: fontFamily.regular, color: colors.textSecondary }]}>
                    Cette fonctionnalité est réservée aux abonnés Premium.
                </Text>
                <TouchableOpacity
                    style={[styles.premiumButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/screens/OfferScreen')}
                >
                    <Text style={[styles.premiumButtonText, { fontFamily: fontFamily.bold }]}>
                        Débloquer Tendances Premium
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const TrendsTab = () => {
        if (!isPremium) return <PremiumLockOverlay />;

        if (trends.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyMessage,
                        { fontFamily: fontFamily.semiBold, color: colors.text }]}>
                        📉 Pas encore de tendances
                    </Text>
                    <Text style={[styles.emptyHint,
                        { fontFamily: fontFamily.regular, color: colors.textSecondary }]}>
                        Ajoutez des transactions pour voir l'évolution de vos catégories
                    </Text>
                </View>
            );
        }

        const rising = trends.filter(t => t.change > 5);
        const falling = trends.filter(t => t.change < -5);
        const stable = trends.filter(t => Math.abs(t.change) <= 5);

        return (
            <ScrollView style={styles.tabContent}>
                <Text style={[styles.tabTitle,
                    { fontFamily: fontFamily.bold, color: colors.text }]}>
                    📉 Évolution des catégories
                </Text>

                {rising.length > 0 && (
                    <View style={[styles.trendCard,
                        { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                        <Text style={[styles.trendTitle,
                            { fontFamily: fontFamily.semiBold, color: '#991B1B' }]}>
                            📈 En hausse ce mois-ci
                        </Text>
                        {rising.map((t, i) => (
                            <View key={i} style={styles.trendItem}>
                                <Text style={[styles.trendCategory,
                                    { fontFamily: fontFamily.regular, color: '#1F2937' }]}>
                                    {t.emoji} {t.category}
                                </Text>
                                <Text style={[styles.trendChange,
                                    { fontFamily: fontFamily.bold, color: '#DC2626' }]}>
                                    {t.change === 100 ? 'Nouveau' : `+${t.change.toFixed(0)}%`}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {falling.length > 0 && (
                    <View style={[styles.trendCard,
                        { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' }]}>
                        <Text style={[styles.trendTitle,
                            { fontFamily: fontFamily.semiBold, color: '#1E3A8A' }]}>
                            📉 En baisse ce mois-ci
                        </Text>
                        {falling.map((t, i) => (
                            <View key={i} style={styles.trendItem}>
                                <Text style={[styles.trendCategory,
                                    { fontFamily: fontFamily.regular, color: '#1F2937' }]}>
                                    {t.emoji} {t.category}
                                </Text>
                                <Text style={[styles.trendChange,
                                    { fontFamily: fontFamily.bold, color: '#2563EB' }]}>
                                    {t.change.toFixed(0)}%
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {stable.length > 0 && (
                    <View style={[styles.trendCard,
                        { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB' }]}>
                        <Text style={[styles.trendTitle,
                            { fontFamily: fontFamily.semiBold, color: '#374151' }]}>
                            🎯 Stable
                        </Text>
                        {stable.map((t, i) => (
                            <View key={i} style={styles.trendItem}>
                                <Text style={[styles.trendCategory,
                                    { fontFamily: fontFamily.regular, color: '#1F2937' }]}>
                                    {t.emoji} {t.category}
                                </Text>
                                <Text style={[styles.trendChange,
                                    { fontFamily: fontFamily.bold, color: '#6B7280' }]}>
                                    {t.change > 0 ? '+' : ''}{t.change.toFixed(0)}%
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        );
    };

    // ════════════════════════════════════════════════════════
    // RENDU PRINCIPAL
    // ════════════════════════════════════════════════════════
    const allViews: Record<number, React.ReactNode> = useMemo(() => ({
        0: <RepartitionTab key="repartition" />,
        1: <ComparisonTab key="comparison" />,
        2: <TrendsTab key="trends" />,
    }), [revenus, depenses, categoryColors, expenses, colors, fontFamily, isPremium]);

    return (
        <View style={styles.container}>
            <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id)}
                        style={[
                            styles.tab,
                            activeTab === tab.id && {
                                backgroundColor: colors.primary,
                                transform: [{ scale: 1.05 }],
                            },
                            tab.id === 2 && !isPremium && { opacity: 0.8 },
                        ]}
                    >
                        <Text style={styles.tabIcon}>{tab.icon}</Text>
                        <Text style={[styles.tabLabel, {
                            fontFamily: fontFamily.semiBold,
                            color: activeTab === tab.id ? '#FFF' : colors.textSecondary,
                        }]}>
                            {tab.label}
                        </Text>
                        {tab.id === 2 && !isPremium && (
                            <Text style={styles.premiumStar}>⭐</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.indicators}>
                {tabs.map((_, i) => (
                    <View key={i} style={[styles.indicator, {
                        backgroundColor: activeTab === i ? colors.primary : colors.border,
                        width: activeTab === i ? 24 : 8,
                    }]} />
                ))}
            </View>

            <View style={styles.content}>
                {allViews[activeTab]}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginTop: 8 },
    tabsContainer: { flexDirection: 'row', padding: 8, borderRadius: 16, gap: 8, marginBottom: 12 },
    tab: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12, alignItems: 'center', backgroundColor: 'transparent', position: 'relative' },
    tabIcon: { fontSize: 24, marginBottom: 4 },
    tabLabel: { fontSize: 12 },
    premiumStar: { position: 'absolute', top: 4, right: 4, fontSize: 10 },
    indicators: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 },
    indicator: { height: 4, borderRadius: 2 },
    content: { minHeight: 300 },
    tabContent: { padding: 4 },
    tabTitle: { fontSize: 18, textAlign: 'center', marginBottom: 16 },
    mainCard: { borderRadius: 16, paddingHorizontal: 16, marginBottom: 12 },
    comparisonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
    comparisonLeft: { flexDirection: 'row', alignItems: 'center', width: 88, gap: 5 },
    comparisonEmoji: { fontSize: 18 },
    comparisonLabel: { fontSize: 12 },
    comparisonCenter: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
    oldAmount: { fontSize: 14, textDecorationLine: 'line-through' },
    arrow: { fontSize: 14, marginHorizontal: 4 },
    newAmount: { fontSize: 16 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, minWidth: 72, alignItems: 'center' },
    badgeText: { fontSize: 11 },
    barsCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
    barsTitle: { fontSize: 15, marginBottom: 4 },
    barsLegend: { fontSize: 11, marginBottom: 12 },
    progressWrapper: { marginBottom: 4 },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    progressLabel: { fontSize: 12 },
    progressTrack: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 4 },
    progressFill: { height: '100%', borderRadius: 5 },
    tipCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 12, marginTop: 4 },
    tipEmoji: { fontSize: 28 },
    tipText: { flex: 1, fontSize: 14, lineHeight: 20 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300, padding: 20 },
    emptyMessage: { fontSize: 18, textAlign: 'center', marginTop: 40 },
    emptyHint: { fontSize: 14, textAlign: 'center', marginTop: 12, paddingHorizontal: 20 },
    trendCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2 },
    trendTitle: { fontSize: 16, marginBottom: 12 },
    trendItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    trendCategory: { fontSize: 15 },
    trendChange: { fontSize: 16 },
    lockContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300, padding: 20 },
    lockCard: { width: '100%', padding: 20, borderRadius: 16, borderWidth: 2, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5 },
    lockIcon: { fontSize: 48, marginBottom: 10 },
    lockTitle: { fontSize: 20, marginBottom: 8, textAlign: 'center' },
    lockDescription: { fontSize: 14, marginBottom: 20, textAlign: 'center' },
    premiumButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, width: '100%', alignItems: 'center' },
    premiumButtonText: { color: '#FFF', fontSize: 16 },
});