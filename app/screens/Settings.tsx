import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../Context/ThemeContext';
import { useAccessibility } from '../../Context/Accessibility';

// Importation des icônes Lucide
import {
    ChevronLeft,
    ChevronRight,
    User,
    Moon,
    Sun,
    Type,
    Star,
    Landmark,
    BarChart3,
    Bell,
    Globe,
    FileText,
    Lock,
    Trash2,
    LogOut
} from 'lucide-react-native';

export default function Settings() {
    const { colors, themePreference, setThemePreference, isDark } = useTheme();
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

    const handleAccountDeletion = () => {
        Alert.alert(
            'Suppression de compte',
            'ATTENTION : Cette action est définitive et toutes vos données seront perdues.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => {
                        AsyncStorage.removeItem('token');
                        AsyncStorage.removeItem('user');
                        router.replace('/screens/LoginScreen');
                    }
                },
            ]
        );
    };

    const MenuItem = ({
        icon: IconComponent,
        title,
        value,
        onPress,
        color = colors.primary
    }: {
        icon: any;
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
                <IconComponent size={22} color={color} />
            </View>
            <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                    {title}
                </Text>
                {value && (
                    <Text style={[styles.menuValue, { color: colors.textSecondary }]}>
                        {value}
                    </Text>
                )}
            </View>
            <ChevronRight size={20} color={colors.textSecondary} strokeWidth={1.5} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#EAF7EF' }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={32} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Paramètres</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* User Info Card */}
                <TouchableOpacity
                    style={[styles.userCard, { backgroundColor: colors.cardBackground }]}
                    onPress={() => router.push('/screens/UserScreen')}
                >
                    <View style={styles.avatar}>
                        <User size={30} color={colors.textSecondary} />
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: colors.text }]}>Utilisateur</Text>
                        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                            user@example.com
                        </Text>
                    </View>
                    <ChevronRight size={20} color={colors.textSecondary} strokeWidth={1.5} />
                </TouchableOpacity>

                <View style={styles.menuSection}>
                    {/* Apparence */}
                    <MenuItem
                        icon={isDark ? Moon : Sun}
                        title="Mode d'apparence"
                        value={themePreference === 'system' ? 'Système' : themePreference === 'dark' ? 'Sombre' : 'Clair'}
                        onPress={() => {
                            const cycle: Record<string, 'light' | 'dark' | 'system'> = {
                                'system': 'light',
                                'light': 'dark',
                                'dark': 'system'
                            };
                            setThemePreference(cycle[themePreference]);
                        }}
                        color="#FF9500"
                    />

                    <MenuItem
                        icon={Type}
                        title="Police accessible"
                        value={accessibleFont ? 'Activée' : 'Désactivée'}
                        onPress={toggleFont}
                        color="#34C759"
                    />

                    <View style={{ height: 20 }} />

                    {/* Clés de l'application */}
                    <MenuItem
                        icon={Star}
                        title="Offres d'abonnement"
                        onPress={() => router.push('/screens/OfferScreen')}
                        color="#FFD700"
                    />

                    <MenuItem
                        icon={Landmark}
                        title="Gestion des comptes"
                        onPress={() => Alert.alert('Info', 'Gestion des comptes à venir')}
                        color="#33C3C7"
                    />

                    <View style={{ height: 20 }} />

                    {/* Données et Légal */}
                    <MenuItem
                        icon={BarChart3}
                        title="Exporter les données"
                        onPress={() => router.push('/screens/ExportScreen')}
                        color="#007AFF"
                    />

                    <MenuItem
                        icon={Bell}
                        title="Notifications"
                        onPress={() => router.push('/screens/NotificationScreen')}
                        color="#FF3B30"
                    />

                    <MenuItem
                        icon={Globe}
                        title="Langue"
                        value="Français"
                        onPress={() => Alert.alert('Info', 'Changement de langue à venir')}
                        color="#5AC8FA"
                    />

                    <MenuItem
                        icon={FileText}
                        title="Conditions d'utilisation"
                        onPress={() => Alert.alert('Info', 'CGU à venir')}
                        color="#AF52DE"
                    />

                    <MenuItem
                        icon={Lock}
                        title="Politique de confidentialité"
                        onPress={() => Alert.alert('Info', 'Politique à venir')}
                        color="#5856D6"
                    />
                </View>

                {/* Section Danger */}
                <View style={styles.dangerSection}>
                    <MenuItem
                        icon={Trash2}
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
                        <LogOut size={22} color={colors.error} />
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
        backgroundColor: '#E0E0E040',
        justifyContent: 'center',
        alignItems: 'center',
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
        padding: 12, // Réduit légèrement pour un look plus compact
        borderRadius: 16,
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 12, // Carré arrondi pour un look moderne
        justifyContent: 'center',
        alignItems: 'center',
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
        fontSize: 13,
        marginTop: 2,
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