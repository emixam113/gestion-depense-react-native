import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import {useRouter} from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../Context/ThemeContext';
import { useAccessibility } from '../Context/Accessibility';

export default function Settings() {
    const { colors, isDark, themePreference, setThemePreference } = useTheme();
    const { accessibleFont, toggleFont } = useAccessibility();
    const router = useRouter();

    const handleLogout = async () => {

        Alert.alert(
            'Déconnexion',
            'Voulez-vous vraiment vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Déconnexion',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.removeItem('token');
                        await AsyncStorage.removeItem('user');
                        router.replace('/screens/LoginScreen');
                    },
                },
            ]
        );
    };

    // NOUVELLE FONCTION DE SUPPRESSION SIMPLIFIÉE
    const handleAccountDeletion = () => {
        Alert.alert(
            'Suppression de compte',
            'ATTENTION : Êtes-vous certain de vouloir supprimer votre compte ? Cette action est définitive et toutes vos données seront perdues.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => {
                        // Logique de suppression ici (appel API)
                        console.log('--- Début de la suppression du compte ---');

                        // Simuler la suppression et la déconnexion
                        AsyncStorage.removeItem('token');
                        AsyncStorage.removeItem('user');
                        router.replace('/screens/LoginScreen');
                    }
                },
            ]
        );
    };
    // FIN NOUVELLE FONCTION

    const MenuItem = ({
        icon,
        title,
        value,
        onPress,
        color = colors.primary
    }: {
        icon: string;
        title: string;
        value?: string;
        onPress: () => void;
        color?: string;
    }) => (
        <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.cardBackground }]}
            onPress={onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <Text style={styles.icon}>{icon}</Text>
            </View>
            <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { fontFamily: 'Poppins', color: colors.text }]}>
                    {title}
                </Text>
                {value && (
                    <Text style={[styles.menuValue, { color: colors.textSecondary }]}>
                        {value}
                    </Text>
                )}
            </View>
            <Text style={[styles.arrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profil</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* User Info */}
                <TouchableOpacity
                    style={[styles.userCard, { backgroundColor: colors.cardBackground }]}
                    onPress={() => Alert.alert('Info', 'Édition du profil à venir')}
                >
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>👤</Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: colors.text }]}>Utilisateur</Text>
                        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                            user@example.com
                        </Text>
                    </View>
                    <Text style={[styles.arrow, { color: colors.textSecondary }]}>›</Text>
                </TouchableOpacity>

                {/* Settings Menu */}
                <View style={styles.menuSection}>

                    {/* --- Section Apparence / Accessibilité --- */}
                    <MenuItem
                        icon="🌙"
                        title="Mode d'apparence"
                        value={themePreference === 'system' ? 'Système' : themePreference === 'dark' ? 'Sombre' : 'Clair'}
                        onPress={() => {
                            const cycle: Record<typeof themePreference, typeof themePreference> = {
                                'system': 'light',
                                'light': 'dark',
                                'dark': 'system'
                            };
                            setThemePreference(cycle[themePreference]);
                        }}
                        color="#FF9500"
                    />

                    <MenuItem
                        icon="🔤"
                        title="Police accessible"
                        value={accessibleFont ? 'Activée' : 'Désactivée'}
                        onPress={toggleFont}
                        color="#34C759"
                    />

                    {/* --- Section Clés de l'application (Ajouts) --- */}
                    <View style={{ height: 20 }} />

                    <MenuItem
                        icon="⭐️"
                        title="Offres d'abonnement"
                        onPress={() => router.push('/screens/OfferScreen')}
                        color="#FFD700"
                    />

                    <MenuItem
                        icon="🏦"
                        title="Gestion des comptes"
                        onPress={() => Alert.alert('Info', 'Gestion des comptes à venir')}
                        color="#33C3C7"
                    />

                    {/* L'ancienne gestion des catégories a été retirée ici */}

                    {/* --- Section Données et Légal --- */}
                    <View style={{ height: 20 }} />

                    <MenuItem
                        icon="📊"
                        title="Exporter les données"
                        onPress={() => Alert.alert('Info', 'Export à venir')}
                        color="#007AFF"
                    />

                    <MenuItem
                        icon="🔔"
                        title="Notifications"
                        onPress={() => Alert.alert('Info', 'Gestion des notifications à venir')}
                        color="#FF3B30"
                    />

                    <MenuItem
                        icon="🌐"
                        title="Langue"
                        value="Français"
                        onPress={() => Alert.alert('Info', 'Changement de langue à venir')}
                        color="#5AC8FA"
                    />

                    <MenuItem
                        icon="📄"
                        title="Conditions d'utilisation"
                        onPress={() => Alert.alert('Info', 'CGU à venir')}
                        color="#AF52DE"
                    />

                    <MenuItem
                        icon="🔒"
                        title="Politique de confidentialité"
                        onPress={() => Alert.alert('Info', 'Politique à venir')}
                        color="#5856D6"
                    />
                </View>

                {/* --- Suppression de Compte --- */}
                <View style={styles.dangerSection}>
                    <MenuItem
                        icon="🗑️"
                        title="Supprimer mon compte"
                        onPress={handleAccountDeletion}
                        color={colors.error}
                    />
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: colors.cardBackground }]}
                    onPress={handleLogout}
                >
                    <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
                        <Text style={styles.icon}>🚪</Text>
                    </View>
                    <Text style={[styles.logoutText, { color: colors.error }]}>
                        Déconnexion
                    </Text>
                </TouchableOpacity>
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
        flex: 1,
        padding: 20,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 28,
    },
    userInfo: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
    },
    userEmail: {
        fontSize: 14,
        marginTop: 2,
    },
    menuSection: {
        gap: 12,
    },
    dangerSection: {
        marginTop: 20,
        gap: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 24,
    },
    menuContent: {
        flex: 1,
        marginLeft: 16,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    menuValue: {
        fontSize: 14,
        marginTop: 2,
    },
    arrow: {
        fontSize: 24,
        fontWeight: '300',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginTop: 24,
        marginBottom: 40,
    },
    logoutText: {
        flex: 1,
        marginLeft: 16,
        fontSize: 16,
        fontWeight: '600',
    },
});