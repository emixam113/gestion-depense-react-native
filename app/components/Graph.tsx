import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity, Image } from "react-native";
import { PieChart } from "react-native-gifted-charts";
<<<<<<< HEAD
import { getCategoryColor } from "../../Utils/Colors";
import { useAccessibility } from "../../Context/Accessibility";
import { useTheme } from "../../Context/ThemeContext";
=======
import { getCategoryColor } from "../Utils/Colors";
import { useAccessibility } from "../Context/Accessibility";
import { useTheme } from "../Context/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Mockup des logos pour l'exemple (à lier à tes assets réels)
const logos = {
   // netflix: require('../assets/logos/netflix.png'),
    //youtube: require('../assets/logos/youtube.png'),
    //spotify: require('../assets/logos/spotify.png'),
};
>>>>>>> origin/main

type GraphProps = {
    revenus?: Record<string, number>;
    depenses?: Record<string, number>;
    categoryColors?: Record<string, string>;
    // Liste fictive pour l'exemple
    abonnements?: Array<{ id: string, nom: string, prix: number, icone: keyof typeof logos }>;
    // C'EST ICI QU'ON GÈRE L'ÉTAT PREMIUM
    isPremium?: boolean;
};

const screenWidth = Dimensions.get("window").width;
const CHART_RADIUS = 110;
const CARD_WIDTH = screenWidth - 60;

export default function Graph({
    revenus = {},
    depenses = {},
    categoryColors = {},
    abonnements = [
        { id: '1', nom: 'Netflix', prix: 13.99, icone: 'netflix' },
        { id: '2', nom: 'YouTube Premium', prix: 12.99, icone: 'youtube' },
        { id: '3', nom: 'Spotify', prix: 10.99, icone: 'spotify' },
    ],
    // Par défaut, l'utilisateur n'est pas premium
    isPremium = false,
}: GraphProps) {
    const { fontFamily } = useAccessibility();
    const { colors, isDark } = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);

    // Préparation des données
    const incomeData = Object.entries(revenus).map(([name, value], index) => ({
        name, value, color: getCategoryColor(name, categoryColors[name], index),
    }));

    const expenseData = Object.entries(depenses).map(([name, value], index) => ({
        name, value, color: getCategoryColor(name, categoryColors[name], index),
    }));

    const formatValue = (val: number) =>
        val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / (CARD_WIDTH + 20));
        if (index !== activeIndex) setActiveIndex(index);
    };

    // --- RENDU PAGES 1 & 2 (PIE CHARTS) ---
    const renderPiePage = (data: any[], title: string) => {
        const totalValue = data.reduce((s, v) => s + v.value, 0);
        return (
            <View style={[styles.graphWrapper, { width: CARD_WIDTH, backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.title, { fontFamily: fontFamily.bold, color: colors.text }]}>{title}</Text>
                {data.length > 0 ? (
                    <View style={styles.chartContainer}>
                        <View style={styles.pieWrapper}>
                            <PieChart
                                donut data={data} radius={CHART_RADIUS} innerRadius={CHART_RADIUS * 0.6}
                                showText textColor={colors.textSecondary} textSize={10} fontFamily={fontFamily.regular}
                            />
                            <View style={styles.centerTextContainer}>
                                <Text style={[styles.centerText, { fontFamily: fontFamily.bold, color: colors.text }]}>
                                    {formatValue(totalValue)}
                                </Text>
                            </View>
                        </View>
                        <ScrollView style={styles.legendScroll} showsVerticalScrollIndicator={false}>
                            {data.map((entry) => (
                                <View key={entry.name} style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: entry.color }]} />
                                    <Text style={[styles.legendText, { fontFamily: fontFamily.regular, color: colors.textSecondary }]}>
                                        {entry.name} ({formatValue(entry.value)})
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                ) : <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucune donnée disponible</Text>}
            </View>
        );
    };

    // --- RENDU PAGE 3 : LE PAYWALL (Ton image_3.png) ---
    const renderPaywallTrends = () => {
        return (
            <View style={[styles.graphWrapper, styles.paywallContainer, { width: CARD_WIDTH, backgroundColor: colors.cardBackground, borderColor: colors.primary }]}>
                {/* L'étoile jaune */}
                <MaterialCommunityIcons name="star" size={100} color="#FACC15" style={styles.paywallStar} />

                {/* Titre et description */}
                <Text style={[styles.paywallTitle, { color: colors.text, fontFamily: fontFamily.bold }]}>Analyse des Tendances</Text>
                <Text style={[styles.paywallText, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
                    Cette fonctionnalité est réservée aux abonnés Premium.
                </Text>

                {/* Le bouton vert de déblocage */}
                <TouchableOpacity style={[styles.paywallButton, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.paywallButtonText, { fontFamily: fontFamily.bold }]}>Débloquer Tendances Premium</Text>
                </TouchableOpacity>
            </View>
        );
    };

    // --- RENDU PAGE 3 (TENDANCES / ABONNEMENTS : Ton image_2.png) ---
    const renderTrendsPage = () => {
        const totalMensuel = abonnements.reduce((s, v) => s + v.prix, 0);
        return (
            <View style={[styles.graphWrapper, { width: CARD_WIDTH, backgroundColor: colors.cardBackground }]}>
                {/* Icône de l'onglet Tendances */}
                <View style={styles.trendsIconContainer}>
                     <MaterialCommunityIcons name="trending-up" size={32} color={colors.primary} />
                </View>

                {/* Titre de la page (Optionnel, ton image 2 n'en a pas mais lePaywall si. On garde la cohérence) */}
                <Text style={[styles.title, { fontFamily: fontFamily.bold, color: colors.text }]}>Abonnements</Text>

                {/* La carte verte du total (Exactement comme image_2.png) */}
                <View style={[styles.savingsCard, { backgroundColor: colors.primary }]}>
                    <Text style={styles.savingsLabel}>Total abonnements / mois</Text>
                    <Text style={styles.savingsValue}>{formatValue(totalMensuel)}</Text>
                    <Text style={styles.savingsYear}>Soit {formatValue(totalMensuel * 12)} / an</Text>
                </View>

                {/* Le titre de la liste (Exactement comme image_2.png) */}
                <Text style={[styles.listHeader, { color: colors.textSecondary, fontFamily: fontFamily.bold }]}>SERVICES DÉTECTÉS</Text>

                {/* La liste des services (Exactement comme image_2.png) */}
                <ScrollView style={styles.subsList} showsVerticalScrollIndicator={false}>
                    {abonnements.map((item) => (
                        <View key={item.id} style={[styles.subRow, { borderBottomColor: colors.border }]}>
                            {/* Le logo du service */}
                            <View style={[styles.logoBox, { backgroundColor: '#f0f0f0' }]}>
                                <Image source={logos[item.icone]} style={styles.logoImage} resizeMode="contain" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.subName, { color: colors.text, fontFamily: fontFamily.bold }]}>{item.nom}</Text>
                                <Text style={[styles.subStatus, { color: colors.textSecondary }]}>Renouvellement mensuel</Text>
                            </View>
                            <Text style={[styles.subPrice, { color: colors.text, fontFamily: fontFamily.bold }]}>{formatValue(item.prix)}</Text>
                        </View>
                    ))}
                </ScrollView>

                {/* L'astuce en bas (Exactement comme image_2.png) */}
                <Text style={[styles.footerTip, { color: colors.primary }]}>💡 Astuce : Désactivez les services inutilisés !</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                onScroll={onScroll} scrollEventThrottle={16}
                snapToInterval={CARD_WIDTH + 20} decelerationRate="fast"
                contentContainerStyle={styles.scrollContainer}
            >
                {/* ORDRE : REVENUS, DÉPENSES, TENDANCES */}
                {renderPiePage(incomeData, "Revenus par source")}
                {renderPiePage(expenseData, "Dépenses par catégorie")}

                {/* ON CHERCHE ICI SI L'UTILISATEUR EST PREMIUM */}
                {isPremium ? renderTrendsPage() : renderPaywallTrends()}
            </ScrollView>

            {/* Pagination à 3 points */}
            <View style={styles.pagination}>
                {[0, 1, 2].map((i) => (
                    <View key={i} style={[styles.dot, {
                        backgroundColor: activeIndex === i ? colors.primary : colors.textSecondary,
                        width: activeIndex === i ? 22 : 8,
                        opacity: activeIndex === i ? 1 : 0.3
                    }]} />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: "center", width: "100%", paddingVertical: 10 },
    scrollContainer: { paddingHorizontal: 20 },
    graphWrapper: {
        marginHorizontal: 10, padding: 20, borderRadius: 30, elevation: 8,
        shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6,
        minHeight: 460,
    },
    title: { textAlign: "center", fontSize: 18, marginBottom: 20 },
    chartContainer: { alignItems: "center", flex: 1 },
    pieWrapper: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
    centerTextContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    centerText: { fontSize: 15, textAlign: 'center' },
    legendScroll: { marginTop: 20, width: '100%', maxHeight: 130 },
    legendItem: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    legendText: { fontSize: 12 },
    emptyText: { textAlign: "center", marginTop: 120, fontSize: 14, fontStyle: 'italic' },

    // Styles spécifiques Page Optimisation (Ton image 2)
    trendsIconContainer: { alignItems: 'center', marginBottom: 10 },
    savingsCard: { padding: 15, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
    savingsLabel: { color: '#fff', fontSize: 13, opacity: 0.9, textAlign: 'center' },
    savingsValue: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginVertical: 3, textAlign: 'center' },
    savingsYear: { color: '#fff', fontSize: 12, opacity: 0.8, textAlign: 'center' },
    listHeader: { fontSize: 11, letterSpacing: 1.2, marginBottom: 12 },
    subsList: { flex: 1 },
    subRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5 },
    logoBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15, padding: 5 },
    logoImage: { width: '100%', height: '100%' },
    subName: { fontSize: 15 },
    subStatus: { fontSize: 11, marginTop: 2 },
    subPrice: { fontSize: 15, marginLeft: 10 },
    footerTip: { textAlign: 'center', fontSize: 12, marginTop: 15, fontStyle: 'italic' },

    // Styles spécifiques Paywall (Ton image 3)
    paywallContainer: { borderVerticalWidth: 3, borderHorizontalWidth: 1.5, alignItems: 'center', justifyContent: 'center', padding: 25 },
    paywallStar: { marginBottom: 20, textAlign: 'center' },
    paywallTitle: { fontSize: 24, textAlign: 'center', marginBottom: 15 },
    paywallText: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 30, paddingHorizontal: 10 },
    paywallButton: { width: '100%', paddingVertical: 15, borderRadius: 14, alignItems: 'center', elevation: 3 },
    paywallButtonText: { color: '#fff', fontSize: 16 },

    // Pagination
    pagination: { flexDirection: "row", marginTop: 15, justifyContent: "center" },
    dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
});