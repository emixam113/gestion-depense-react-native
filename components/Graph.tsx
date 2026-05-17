import React, { useState, useContext } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent
} from "react-native";
import { PieChart } from "react-native-gifted-charts";

import { getCategoryColor } from "../Utils/Colors";
import { useAccessibility } from "../Context/Accessibility";
import { useTheme } from "../Context/ThemeContext";
// ✅ Import de ton context de souscription
import { SubscriptionContext } from "../Context/SubscriptionsProvider";

// ✅ Import de ton composant de verrouillage (à adapter selon ton chemin réel)
import PremiumLockView from "./PremiumLockView";

const screenWidth = Dimensions.get("window").width;
const CARD_WIDTH = screenWidth - 60;
const CHART_RADIUS = 100;

type GraphProps = {
    revenus?: Record<string, number>;
    depenses?: Record<string, number>;
    categoryColors?: Record<string, string>;
};

export default function Graph({
    revenus = {},
    depenses = {},
    categoryColors = {},
}: GraphProps) {
    const { fontFamily } = useAccessibility();
    const { colors, isDark } = useTheme();

    // ✅ Utilisation de ton SubscriptionContext
    const { isPremium } = useContext(SubscriptionContext);

    const [activeIndex, setActiveIndex] = useState(0);

    const formatValue = (val: number) =>
        val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

    // --- PRÉPARATION DES DONNÉES ---

    const incomeData = Object.entries(revenus).map(([name, value], index) => ({
        value,
        color: getCategoryColor(name, categoryColors[name], index),
        label: name
    }));
    const totalIncomes = Object.values(revenus).reduce((acc, val) => acc + val, 0);

    const expenseData = Object.entries(depenses).map(([name, value], index) => ({
        value,
        color: getCategoryColor(name, categoryColors[name], index),
        label: name
    }));
    const totalExpenses = Object.values(depenses).reduce((acc, val) => acc + val, 0);

    const solde = totalIncomes - totalExpenses;
    const isPositive = solde >= 0;

    const savingsData = [
        { value: totalExpenses, color: colors.error, label: 'Dépenses' },
        {
            value: isPositive ? solde : 0,
            color: colors.primary,
            label: isPositive ? 'Épargne / Reste' : 'Découvert'
        },
    ];

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const x = event.nativeEvent.contentOffset.x;
        const index = Math.round(x / (CARD_WIDTH + 20));
        if (index !== activeIndex) setActiveIndex(index);
    };

    const renderPage = (title: string, data: any[], totalLabel: string, totalValue: number, isLockedPage: boolean = false) => (
        <View style={[styles.graphWrapper, { width: CARD_WIDTH, backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.title, { color: colors.text, fontFamily: fontFamily.bold }]}>
                {title}
            </Text>

            <View style={styles.chartContainer}>
                <PieChart
                    donut
                    data={data.length > 0 ? data : [{ value: 1, color: '#E0E0E0' }]}
                    radius={CHART_RADIUS}
                    innerRadius={CHART_RADIUS * 0.7}
                    innerCircleColor={colors.cardBackground}
                    centerLabelComponent={() => (
                        <View style={styles.centerLabel}>
                            {/* ✅ CORRECTION : Le montant s'adapte au thème (Blanc en Dark Mode, Noir sinon) */}
                            <Text style={[
                                styles.totalAmount,
                                { color: isDark ? "#FFFFFF" : "#000000", fontFamily: fontFamily.bold }
                            ]}>
                                {formatValue(totalValue)}
                            </Text>
                            <Text style={{ fontSize: 10, color: colors.textSecondary, fontFamily: fontFamily.regular }}>
                                {totalLabel}
                            </Text>
                        </View>
                    )}
                />

                <ScrollView style={styles.legendScroll} showsVerticalScrollIndicator={false}>
                    {data.map((item, idx) => (
                        <View key={idx} style={[styles.legendCard, { backgroundColor: isDark ? '#1F1F1F' : '#F8F9FA' }]}>
                            <View style={styles.legendLeft}>
                                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                <Text style={[styles.legendText, { color: colors.text, fontFamily: fontFamily.semiBold }]}>
                                    {item.label}
                                </Text>
                            </View>
                            <Text style={[styles.legendAmount, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
                                {formatValue(item.value)}
                            </Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* ✅ Utilisation de ton PremiumLockView sur la page Santé Financière */}
            {isLockedPage && !isPremium && (
                <View style={StyleSheet.absoluteFill}>
                    <PremiumLockView />
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                snapToInterval={CARD_WIDTH + 20}
                decelerationRate="fast"
                contentContainerStyle={styles.scrollContent}
            >
                {/* SLIDE 1 */}
                {renderPage("Revenus par source", incomeData, "Total", totalIncomes)}

                {/* SLIDE 2 */}
                {renderPage("Dépenses par catégorie", expenseData, "Total", totalExpenses)}

                {/* SLIDE 3 : Verrouillé par PremiumLockView si non Premium */}
                {renderPage("Santé Financière", savingsData, isPositive ? "Reste" : "Déficit", solde, true)}
            </ScrollView>

            <View style={styles.pagination}>
                {[0, 1, 2].map((i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            {
                                backgroundColor: activeIndex === i ? colors.primary : colors.textSecondary,
                                width: activeIndex === i ? 20 : 8,
                                opacity: activeIndex === i ? 1 : 0.3
                            }
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingVertical: 10 },
    scrollContent: { paddingHorizontal: 20 },
    graphWrapper: {
        marginHorizontal: 10,
        padding: 20,
        borderRadius: 28,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        minHeight: 480,
        overflow: 'hidden',
        position: 'relative'
    },
    title: { textAlign: "center", fontSize: 17, marginBottom: 20 },
    chartContainer: { alignItems: "center", flex: 1 },
    centerLabel: { justifyContent: 'center', alignItems: 'center' },
    totalAmount: { fontSize: 14, textAlign: 'center' },
    legendScroll: { marginTop: 20, width: '100%' },
    legendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 14,
        marginBottom: 8,
    },
    legendLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 14 },
    legendAmount: { fontSize: 13 },
    pagination: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 15
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
});