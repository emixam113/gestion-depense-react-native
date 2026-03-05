import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../Context/ThemeContext';
import { useAccessibility } from '../Context/Accessibility';


const OFFERS = [
    {
        id: 'free',
        title: 'Plan Basique',
        price: 'Gratuit',
        features: [
            'Jusqu\'à 50 transactions par mois',
            '1 seul compte de suivi',
            'Analyses de base',
            'Sauvegarde des données locale'
        ],
        color: '#34C759', // Vert
    },
    {
        id: 'premium',
        title: 'Premium Illimité',
        price: '4.99 € / mois',
        features: [
            'Transactions illimitées (plus de limites)',
            'Comptes multiples (jusqu\'à 10)',
            'Analyses et rapports avancés',
            'Export CSV illimité',
            'Sécurité et chiffrement renforcés' // Synchronisation Cloud retirée
        ],
        color: '#FFD700', // Or/Jaune
    },
];

// =====================
// Composant Carte d'Offre (Réutilisable)
// =====================
const OfferCard = React.memo(({ offer, currentSubscriptionId, handleAction }: any) => {
    const { colors } = useTheme();
    const { fontFamily } = useAccessibility();
    const isCurrent = offer.id === currentSubscriptionId;

    const cardStyle = useMemo(() => ([
        styles.offerCard,
        {
            backgroundColor: isCurrent ? offer.color + '20' : colors.cardBackground,
            borderColor: isCurrent ? offer.color : colors.border
        }
    ]), [isCurrent, offer.color, colors.cardBackground, colors.border]);

    return (
        <View style={cardStyle}>
            <Text style={[styles.offerTitle, { fontFamily: fontFamily.bold, color: isCurrent ? offer.color : colors.text }]}>
                {offer.title} {isCurrent ? ' (Actif)' : ''}
            </Text>
            <Text style={[styles.offerPrice, { color: colors.text }]}>{offer.price}</Text>

            <View style={styles.featureList}>
                {offer.features.map((feature: string, index: number) => (
                    <Text key={index} style={[styles.featureText, { color: colors.textSecondary }]}>
                        ✅ {feature}
                    </Text>
                ))}
            </View>

            {/* Bouton d'action: Mettre à niveau ou Indiquer le plan actif */}
            {!isCurrent && (
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: offer.color }]}
                    onPress={() => handleAction(offer.id, offer.title)}
                >
                    <Text style={[styles.actionButtonText, { fontFamily: fontFamily.semiBold }]}>
                        {offer.id === 'free' ? 'Plan de base' : `Passer à ${offer.title}`}
                    </Text>
                </TouchableOpacity>
            )}

            {isCurrent && (
                <Text style={[styles.currentPlanText, { color: offer.color, fontFamily: fontFamily.semiBold }]}>
                    C'est votre plan actuel !
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

    // 💡 Simulation du statut de l'utilisateur.
    const currentSubscriptionId = 'free';

    const handleAction = (offerId: string, offerTitle: string) => {
        if (offerId === 'premium') {
            Alert.alert(
                'Abonnement Premium',
                `Démarrer l'upgrade vers ${offerTitle}. (Appel au service de paiement)`,
                [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Procéder au paiement', onPress: () => console.log('Paiement pour Premium initié.') }
                ]
            );
        } else {
             Alert.alert('Information', 'Ceci est le plan de base, pas d\'action requise.');
        }
    };

    const handleManageBilling = () => {
        Alert.alert(
            'Gestion de la Facturation',
            'Ouverture du portail de facturation pour gérer le paiement ou annuler l\'abonnement Premium.',
            [{ text: 'OK' }]
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Offres d'abonnement</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fontFamily.bold }]}>
                    Améliorez vos finances
                </Text>

                {OFFERS.map(offer => (
                    <OfferCard
                        key={offer.id}
                        offer={offer}
                        currentSubscriptionId={currentSubscriptionId}
                        handleAction={handleAction}
                    />
                ))}

                {/* Information et lien de gestion pour les abonnés Premium */}
                {currentSubscriptionId === 'premium' && (
                    <TouchableOpacity
                        style={styles.manageLink}
                        onPress={handleManageBilling}
                    >
                        <Text style={[styles.linkText, { color: colors.primary, fontFamily: fontFamily.semiBold }]}>
                            Gérer ma facturation et annuler
                        </Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 32,
        color: '#FFF',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFF',
    },
    content: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    sectionTitle: {
        fontSize: 18,
        marginTop: 10,
        marginBottom: 25,
        textAlign: 'center',
    },
    offerCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 2,
    },
    offerTitle: {
        fontSize: 22,
        marginBottom: 8,
    },
    offerPrice: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    featureList: {
        marginBottom: 20,
        gap: 8,
    },
    featureText: {
        fontSize: 14,
    },
    actionButton: {
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 16,
        color: '#FFF',
    },
    currentPlanText: {
        fontSize: 16,
        textAlign: 'center',
        padding: 12,
        fontWeight: 'bold',
    },
    manageLink: {
        marginTop: 15,
        marginBottom: 40,
        alignItems: 'center',
    },
    linkText: {
        fontSize: 14,
        fontWeight: 'bold',
    }
});