import React, { useMemo, useEffect, useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useTheme } from '../../Context/ThemeContext';
import { useAccessibility } from '../../Context/Accessibility';
import { SubscriptionContext } from '../../Context/SubscriptionsProvider';

const OfferCard = React.memo(({ pkg, isCurrent, handleAction }: any) => {
    const { colors } = useTheme();
    const { fontFamily } = useAccessibility();

    // RevenueCat extrait les infos du produit (Titre, Prix, Description)
    const { title, priceString, description } = pkg.product;

    const isPremium = title.toLowerCase().includes('premium');
    const accentColor = isPremium ? '#FFD700' : '#34C759';

    const cardStyle = useMemo(() => ([
        styles.offerCard,
        {
            backgroundColor: isCurrent ? accentColor + '20' : colors.cardBackground,
            borderColor: isCurrent ? accentColor : colors.border
        }
    ]), [isCurrent, colors.cardBackground, colors.border, accentColor]);

    return (
        <View style={cardStyle}>
            <Text style={[styles.offerTitle, { fontFamily: fontFamily.bold, color: isCurrent ? accentColor : colors.text }]}>
                {title} {isCurrent ? ' (Actif)' : ''}
            </Text>
            <Text style={[styles.offerPrice, { color: colors.text }]}>{priceString}</Text>

            <View style={styles.featureList}>
                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                    ✅ {description || "Accès complet aux fonctionnalités Premium"}
                </Text>
            </View>

            {!isCurrent && (
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: accentColor }]}
                    onPress={() => handleAction(pkg)}
                >
                    <Text style={[styles.actionButtonText, { fontFamily: fontFamily.semiBold }]}>
                        S'abonner
                    </Text>
                </TouchableOpacity>
            )}

            {isCurrent && (
                <Text style={[styles.currentPlanText, { color: accentColor, fontFamily: fontFamily.semiBold }]}>
                    Votre plan actuel
                </Text>
            )}
        </View>
    );
});

// =====================
// Écran principal
// =====================
export default function SubscriptionScreen() {
    const { colors } = useTheme();
    const { fontFamily } = useAccessibility();
    const router = useRouter();

    // ✅ Utilisation du contexte pour suivre le statut Premium
    const { isPremium, loading: contextLoading } = useContext(SubscriptionContext);
    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [fetching, setFetching] = useState(true);

    // Charger les offres réelles configurées sur RevenueCat
    useEffect(() => {
        const loadOfferings = async () => {
            try {
                const offerings = await Purchases.getOfferings();
                if (offerings.current !== null) {
                    setPackages(offerings.current.availablePackages);
                }
            } catch (e: any) {
                console.error("Erreur RevenueCat Offerings:", e);
            } finally {
                setFetching(false);
            }
        };
        loadOfferings();
    }, []);

    // Gestion de l'achat réel
    const handlePurchase = async (pkg: PurchasesPackage) => {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pkg);

            // Vérification de l'entitlement défini dans RevenueCat
            if (typeof customerInfo.entitlements.active['premium'] !== "undefined") {
                Alert.alert("Succès", "Félicitations, vous êtes Premium !");
                router.back();
            }
        } catch (e: any) {
            if (!e.userCancelled) {
                Alert.alert("Erreur", e.message);
            }
        }
    };

    if (fetching || contextLoading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Offres d'abonnement</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fontFamily.bold }]}>
                    {isPremium ? "Merci de votre soutien !" : "Améliorez vos finances"}
                </Text>

                {packages.length > 0 ? (
                    packages.map((pkg) => (
                        <OfferCard
                            key={pkg.identifier}
                            pkg={pkg}
                            isCurrent={isPremium && pkg.product.identifier.includes('premium')}
                            handleAction={handlePurchase}
                        />
                    ))
                ) : (
                    <Text style={{ color: colors.text, textAlign: 'center', marginTop: 20 }}>
                        Aucune offre disponible pour le moment.
                    </Text>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center' },
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
    headerTitle: { fontSize: 20, fontWeight: '600', color: '#FFF' },
    content: { paddingHorizontal: 20, paddingVertical: 10 },
    sectionTitle: { fontSize: 18, marginTop: 10, marginBottom: 25, textAlign: 'center' },
    offerCard: { padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 2 },
    offerTitle: { fontSize: 22, marginBottom: 8 },
    offerPrice: { fontSize: 28, fontWeight: 'bold', marginBottom: 15 },
    featureList: { marginBottom: 20, gap: 8 },
    featureText: { fontSize: 14 },
    actionButton: { padding: 12, borderRadius: 10, alignItems: 'center' },
    actionButtonText: { fontSize: 16, color: '#FFF' },
    currentPlanText: { fontSize: 16, textAlign: 'center', padding: 12, fontWeight: 'bold' }
});