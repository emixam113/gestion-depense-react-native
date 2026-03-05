import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getWithAuth, sendWithAuth } from "../services/Api";
import AddExpense from "../components/AddExpense";
import ExpenseList from '../components/ExpenseList';
import Graph from '../components/Graph';
import AddCategory from '../components/AddCategory';
import CategoryList from '../components/CategoryList';
import { useAccessibility } from '../Context/Accessibility';
import { useTheme } from '../Context/ThemeContext';
import { useRouter } from 'expo-router'; // 🚀 CORRECTION : Utilisation de useRouter pour Expo Router
import { StackNavigationProp } from '@react-navigation/stack'; // ❌ Cet import sera retiré si le typage n'est pas utilisé
import StatsTabsSwipe from '../components/StatsTabsSwipe';

import type {
    Category,
    Expense,
    CreateExpenseDto,
    ExpenseFormData,
    User
} from '../Types';

const settingsIcon = require('../../assets/images/settings.png');

const Dashboard: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]); // ⚠️ Changé 'Expenses' en 'Expense'
    const [categories, setCategories] = useState<Category[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // 🚀 CORRECTION : Initialisation du router
    const router = useRouter();

    const {
        accessibleFont,
        toggleFont,
        isLoading: accessibilityLoading,
        fontFamily
    } = useAccessibility();

    // ⚠️ Correction : themePreference manquait dans ta déstructuration
    const { colors, isDark, setThemePreference, themePreference, setUserId } = useTheme();

    const handleToggleTheme = () => {
        const cycle: Record<typeof themePreference, typeof themePreference> = {
            'system': 'light',
            'light': 'dark', // ⚠️ Correction : 'ligth' en 'light'
            'dark': 'system'
        };
        setThemePreference(cycle[themePreference]);
    };

    const loadData = useCallback(async () => {
        try {
            setRefreshing(true);

            const storedToken = await AsyncStorage.getItem("token");
            if (!storedToken) {
                Alert.alert("Erreur", "Vous devez être connecté");
                return; // ❌ Permet de sortir sans appeler setLoading(false)
            }
            setToken(storedToken);


            const [expensesData, categoriesData, userData] = await Promise.all([
                getWithAuth<Expense[]>("/expenses/me").catch(err => {
                    console.error("❌ Erreur /expenses/me:", err.message);
                    return []; // Retourne un tableau vide en cas d'erreur
                }),
                getWithAuth<Category[]>("/categories").catch(err => {
                    console.error("❌ Erreur /categories:", err.message);
                    return []; // Retourne un tableau vide en cas d'erreur
                }),
                getWithAuth<User>("/users/me").catch(err => {
                    console.error("❌ Erreur /users/me:", err.message);
                    return getWithAuth<User>("/auth/profile").catch(err2 => {
                        console.error("❌ Erreur /auth/profile:", err2.message);
                        return null; // Retourne null si les deux échouent
                    });
                }),
            ]);

            console.log("✅ Données chargées:", {
                expenses: expensesData?.length || 0,
                categories: categoriesData?.length || 0,
                user: userData?.firstName
            });

            setExpenses(expensesData || []);
            setCategories(categoriesData || []);
            setUser(userData || null);
        } catch (error) {
            // ❌ Gère toute erreur non capturée par les Promise.catch
            console.error("❌ Erreur lors du chargement:", error);
            Alert.alert("Erreur", "Impossible de charger les données");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [setUserId, themePreference]); // Ajout de dépendances pour useCallback

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (user?.id) {
            setUserId(user.id.toString());
            console.log("👤 User ID défini pour les préférences de thème:", user.id);
        }
    }, [user, setUserId]);

    const handleAddExpense = async (formData: ExpenseFormData) => {
        try {
            const categoryObj = categories.find(cat => cat.name === formData.category);

            if (!categoryObj) {
                Alert.alert("Erreur", "Catégorie invalide");
                return;
            }

            const expenseData: CreateExpenseDto = {
                label: formData.description,
                amount: formData.amount,
                type: formData.type,
                categoryId: categoryObj.id,
                date: new Date().toISOString(),
            };

            console.log("📤 Envoi de la dépense:", expenseData);

            const createdExpense = await sendWithAuth<Expense>(
                "/expenses",
                "POST",
                expenseData
            );

            console.log("✅ Dépense créée:", createdExpense);

            setExpenses((prev) => [createdExpense, ...prev]);
            Alert.alert("Succès", "Transaction ajoutée avec succès");
        } catch (error: any) {
            console.error("Erreur ajout dépense:", error.message);
            Alert.alert("Erreur", "Impossible d'ajouter la transaction");
        }
    };

    const handleDeleteSuccess = (expenseId: number) => {
        console.log("🗑️ Suppression de la dépense:", expenseId);
        setExpenses((prev) => prev.filter((exp) => exp.id !== expenseId));
    };

    const handleCategoryAdded = (newCategory: Category) => {
        console.log("✅ Nouvelle catégorie:", newCategory);
        setCategories((prev) => [...prev, newCategory]);
        Alert.alert("Succès", `Catégorie "${newCategory.name}" ajoutée`);
    };

    const calculateBalance = (): number => {
        if (!expenses || expenses.length === 0) return 0;

        return expenses.reduce((acc, expense) => {
            const amount = Math.abs(parseFloat(expense.amount)) || 0;
            return expense.type === "expense" ? acc - amount : acc + amount;
        }, 0);
    };

    const calculateCategoryTotals = () => {
        const revenus: Record<string, number> = {};
        const depenses: Record<string, number> = {};
        const categoryColors: Record<string, string> = {};

        expenses.forEach((expense) => {
            const categoryName = expense.category?.name;
            if (!categoryName) return;

            const amount = Math.abs(parseFloat(expense.amount)) || 0;
            categoryColors[categoryName] = expense.category?.color || '#000000';

            if (expense.type === "income") {
                revenus[categoryName] = (revenus[categoryName] || 0) + amount;
            } else {
                depenses[categoryName] = (depenses[categoryName] || 0) + amount;
            }
        });

        return { revenus, depenses, categoryColors };
    };

    const balance = useMemo(() => calculateBalance(), [expenses]);
    const { revenus, depenses, categoryColors } = useMemo(() => calculateCategoryTotals(), [expenses]);

    if (loading || accessibilityLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { fontFamily: fontFamily.regular, color: colors.text }]}>
                    Chargement...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={loadData}
                    tintColor={isDark ? colors.text : colors.primary}
                />
            }
        >
            {/* HEADER */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View style={styles.headerTop}>
                    <Text style={[styles.welcomeText, { fontFamily: fontFamily.bold }]}>
                        Bonjour {user?.firstName || "Utilisateur"}
                    </Text>

                    <View style={styles.toggleContainer}>
                        {/* THEME */}
                        <TouchableOpacity
                            style={[styles.toggleButton, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' }]}
                            onPress={handleToggleTheme}
                        >
                            <Text style={[styles.toggleButtonText, { fontFamily: fontFamily.semiBold, color: isDark ? colors.surface : '#FFF' }]}>
                                {themePreference === 'system' ? '🔄' : isDark ? '☀️' : '🌙'}
                            </Text>
                        </TouchableOpacity>

                        {/* ACCESSIBILITÉ */}
                        <TouchableOpacity
                            style={[styles.toggleButton, accessibleFont ? { backgroundColor: isDark ? colors.surface : '#FFF' } : {}]}
                            onPress={toggleFont}
                        >
                            <Text style={[styles.toggleButtonText, accessibleFont ? { color: colors.primary } : { color: isDark ? colors.surface : '#FFF' }, { fontFamily: fontFamily.semiBold }]}>
                                {accessibleFont ? 'A+' : 'A'}
                            </Text>
                        </TouchableOpacity>

                        {/* SETTINGS (CORRIGÉ) */}
                        <TouchableOpacity
                            style={[styles.toggleButton, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)' }]}
                            onPress={() => router.push('/screens/Settings')} // 🚀 CORRECTION : Utilisation de router.push pour Settings
                        >
                            <Image
                                source={settingsIcon}
                                style={{ width: 24, height: 24, tintColor: isDark ? colors.surface : '#FFF' }}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={[styles.balanceLabel, { fontFamily: fontFamily.regular }]}>
                    Solde actuel
                </Text>
                <Text style={[styles.balanceAmount, { fontFamily: fontFamily.bold }]}>
                    {balance.toFixed(2)} €
                </Text>
            </View>

            {/* GRAPH */}
            {expenses.length > 0 && (
                <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.sectionTitle, { fontFamily: fontFamily.semiBold, color: colors.text }]}>
                        📊 Statistiques
                    </Text>
                    <StatsTabsSwipe
                                revenus={revenus}
                                depenses={depenses}
                                categoryColors={categoryColors}
                                expenses={expenses}
                    />
                </View>
            )}

            {/* AJOUTER UNE CATEGORY */}
            <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                <AddCategory token={token} onCategoryAdded={handleCategoryAdded} />
            </View>

            {/* LISTE CATEGORY */}
            <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.sectionTitle, { fontFamily: fontFamily.semiBold, color: colors.text }]}>
                    📁 Catégories ({categories.length})
                </Text>
                <CategoryList
                    token={token}
                    onDeleteCategory={(id) => {
                        setCategories((prev) => prev.filter((cat) => cat.id !== id));
                        console.log("🗑️ Catégorie supprimée:", id);
                    }}
                />
            </View>

            {/* AJOUT EXPENSE */}
            <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                <AddExpense categories={categories.map(cat => cat.name)} onAdd={handleAddExpense} />
            </View>

            {/* EXPENSE LIST */}
            <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.sectionTitle, { fontFamily: fontFamily.semiBold, color: colors.text }]}>
                    💳 Dernières transactions ({expenses.length})
                </Text>
                <ExpenseList
                    expenses={expenses}
                    onDeleteSuccess={handleDeleteSuccess}
                    onEditSuccess={(updated) => setExpenses((prev) => prev.map((exp) => exp.id === updated.id ? updated : exp))}
                    token={token}
                />
            </View>
        </ScrollView>
    );
};

export default Dashboard;

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { marginTop: 10, fontSize: 16 },
    header: { padding: 20, paddingTop: 60, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
    welcomeText: { fontSize: 24, color: "#FFF", flex: 1 },
    toggleContainer: { flexDirection: "row" },
    toggleButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, minWidth: 40, alignItems: "center", marginRight: 8 },
    toggleButtonText: { fontSize: 16 },
    balanceLabel: { fontSize: 14, color: "#E3F2FD", marginBottom: 5 },
    balanceAmount: { fontSize: 36, color: "#FFF" },
    section: { margin: 15, padding: 15, borderRadius: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    sectionTitle: { fontSize: 18, marginBottom: 15 },
});