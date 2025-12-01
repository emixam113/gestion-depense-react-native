import React, { useState, useEffect, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	RefreshControl,
	ActivityIndicator,
	Alert,
	TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getWithAuth, sendWithAuth } from "../services/Api";
import AddExpense from "../components/AddExpense";
import ExpenseList from '../components/ExpenseList';
import Graph from '../components/Graph';
import AddCategory from '../components/AddCategory';
import { useAccessibility } from '../Context/Accessibility';

// Import des types centralisés
import type {
	Category,
	Expense,
	CreateExpenseDto,
	ExpenseFormData,
	User
} from '../Types';

export default function Dashboard() {
	const [expenses, setExpenses] = useState<Expense[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	// ✅ Hook d'accessibilité
	const { accessibleFont, toggleFont, isLoading: accessibilityLoading } = useAccessibility();

	// Chargement des données depuis l'API
	const loadData = useCallback(async () => {
		try {
			setRefreshing(true);

			// Récupération du token
			const storedToken = await AsyncStorage.getItem("token");
			if (!storedToken) {
				Alert.alert("Erreur", "Vous devez être connecté");
				return;
			}
			setToken(storedToken);

			// Routes backend correctes
			const [expensesData, categoriesData, userData] = await Promise.all([
				getWithAuth<Expense[]>("/expenses/me"),
				getWithAuth<Category[]>("/categories"),
				getWithAuth<User>("/users/me").catch(err => {
					console.error("❌ Erreur /users/me:", err.message);
					return getWithAuth<User>("/auth/profile").catch(err2 => {
						console.error("❌ Erreur /auth/profile:", err2.message);
						return null;
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
			console.error("❌ Erreur lors du chargement:", error);
			Alert.alert("Erreur", "Impossible de charger les données");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	// Chargement initial
	useEffect(() => {
		loadData();
	}, [loadData]);

	// Ajout d'une nouvelle dépense
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
			console.error("❌ Erreur ajout dépense:", error.message);
			Alert.alert("Erreur", "Impossible d'ajouter la transaction");
		}
	};

	// Suppression d'une dépense
	const handleDeleteSuccess = (expenseId: number) => {
		console.log("🗑️ Suppression de la dépense:", expenseId);
		setExpenses((prev) => prev.filter((exp) => exp.id !== expenseId));
	};

	// Callback après ajout de catégorie
	const handleCategoryAdded = (newCategory: Category) => {
		console.log("✅ Nouvelle catégorie:", newCategory);
		setCategories((prev) => [...prev, newCategory]);
		Alert.alert("Succès", `Catégorie "${newCategory.name}" ajoutée`);
	};

	// Calcul du solde
	const calculateBalance = (): number => {
		if (!expenses || expenses.length === 0) {
			return 0;
		}

		try {
			const balance = expenses.reduce((acc, expense) => {
				const amount = parseFloat(expense.amount) || 0;
				return acc + amount;
			}, 0);

			return balance;
		} catch (error) {
			console.error("❌ Erreur calcul solde:", error);
			return 0;
		}
	};

	// Calcul des totaux par catégorie pour le Graph
	const calculateCategoryTotals = () => {
		const revenus: Record<string, number> = {};
		const depenses: Record<string, number> = {};
		const categoryColors: Record<string, string> = {};

		if (!expenses || expenses.length === 0) {
			return { revenus, depenses, categoryColors };
		}

		expenses.forEach((expense) => {
			if (!expense.category) return;

			const categoryName = expense.category.name;
			const amount = Math.abs(parseFloat(expense.amount)) || 0;

			categoryColors[categoryName] = expense.category.color;

			if (expense.type === "income") {
				revenus[categoryName] = (revenus[categoryName] || 0) + amount;
			} else {
				depenses[categoryName] = (depenses[categoryName] || 0) + amount;
			}
		});

		return { revenus, depenses, categoryColors };
	};

	const { revenus, depenses, categoryColors } = calculateCategoryTotals();
	const balance = calculateBalance();

	if (loading || accessibilityLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#28A745" />
				<Text style={[
					styles.loadingText,
					{ fontFamily: accessibleFont ? 'Atkinson-Regular' : 'Poppins_400Regular' }
				]}>
					Chargement...
				</Text>
			</View>
		);
	}

	return (
		<ScrollView
			style={styles.container}
			refreshControl={
				<RefreshControl refreshing={refreshing} onRefresh={loadData} />
			}
		>
			{/* En-tête utilisateur */}
			<View style={styles.header}>
				<View style={styles.headerTop}>
					<Text style={[
						styles.welcomeText,
						{ fontFamily: accessibleFont ? 'Atkinson-Regular' : 'Poppins_700Bold' },
						accessibleFont && { fontWeight: 'bold' }
					]}>
						Bonjour {user?.firstName || "Utilisateur"} 👋
					</Text>

					{/* Bouton Toggle Accessibilité */}
					<TouchableOpacity
						style={[styles.toggleButton, accessibleFont && styles.toggleButtonActive]}
						onPress={toggleFont}
						accessibilityLabel="Activer ou désactiver la police accessible Atkinson Hyperlegible"
						accessibilityRole="button"
					>
						<Text style={[
							styles.toggleButtonText,
							accessibleFont && styles.toggleButtonTextActive,
							{ fontFamily: accessibleFont ? 'Atkinson-Regular' : 'Poppins_600SemiBold' }
						]}>
							{accessibleFont ? 'A+' : 'A'}
						</Text>
					</TouchableOpacity>
				</View>

				<Text style={[
					styles.balanceLabel,
					{ fontFamily: accessibleFont ? 'Atkinson-Regular' : 'Poppins_400Regular' }
				]}>
					Solde actuel
				</Text>
				<Text style={[
					styles.balanceAmount,
					{ fontFamily: accessibleFont ? 'Atkinson-Regular' : 'Poppins_700Bold' },
					accessibleFont && { fontWeight: 'bold' }
				]}>
					{balance.toFixed(2)} €
				</Text>
			</View>

			{/* Bloc de test des polices */}
			<View style={styles.testBlock}>
				<Text style={[
					styles.testTitle,
					{ fontFamily: accessibleFont ? 'Atkinson-Regular' : 'Poppins_600SemiBold' },
					accessibleFont && { fontWeight: 'bold' }
				]}>
					Test de police : 0O Il1 2025
				</Text>
				<Text style={[
					styles.testDescription,
					{ fontFamily: accessibleFont ? 'Atkinson-Regular' : 'Poppins_400Regular' }
				]}>
					Police active : {accessibleFont ? 'Atkinson Hyperlegible ✓' : 'Poppins'}
				</Text>
				<Text style={[
					styles.testHint,
					{ fontFamily: accessibleFont ? 'Atkinson-Regular' : 'Poppins_400Regular' }
				]}>
					{accessibleFont
						? '→ Le 0 devrait être barré (Ø) en Atkinson'
						: '→ Cliquez sur A+ pour activer Atkinson'}
				</Text>
			</View>

			{/* Graphique */}
			{expenses.length > 0 && (
				<View style={styles.section}>
					<Text style={[
						styles.sectionTitle,
						{ fontFamily: accessibleFont ? 'Atkinson-Regular' : 'Poppins_600SemiBold' },
						accessibleFont && { fontWeight: 'bold' }
					]}>
						📊 Statistiques
					</Text>
					<Graph
						revenus={revenus}
						depenses={depenses}
						categoryColors={categoryColors}
					/>
				</View>
			)}

			{/* Ajout de catégorie */}
			<View style={styles.section}>
				<AddCategory
					token={token}
					onCategoryAdded={handleCategoryAdded}
				/>
			</View>

			{/* Formulaire d'ajout de dépense */}
			<View style={styles.section}>
				<AddExpense
					categories={categories.map(cat => cat.name)}
					onAdd={handleAddExpense}
				/>
			</View>

			{/* Liste des dépenses */}
			<View style={styles.section}>
				<Text style={[
					styles.sectionTitle,
					{ fontFamily: accessibleFont ? 'Atkinson-Regular' : 'Poppins_600SemiBold' },
					accessibleFont && { fontWeight: 'bold' }
				]}>
					💳 Dernières transactions ({expenses.length})
				</Text>
				{expenses.length === 0 ? (
					<Text style={[
						styles.emptyText,
						{ fontFamily: accessibleFont ? 'Atkinson-Regular' : 'Poppins_400Regular' }
					]}>
						Aucune transaction pour le moment. Commencez par ajouter une dépense ! 🎯
					</Text>
				) : (
					<ExpenseList
						expenses={expenses}
						onDeleteSuccess={handleDeleteSuccess}
					/>
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#EAF7EF",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#EAF7EF",
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
		color: "#666",
	},
	header: {
		backgroundColor: "#28A745",
		padding: 20,
		paddingTop: 60,
		borderBottomLeftRadius: 20,
		borderBottomRightRadius: 20,
	},
	headerTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 10,
	},
	welcomeText: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#FFF",
		flex: 1,
	},
	toggleButton: {
		backgroundColor: "rgba(255, 255, 255, 0.3)",
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		marginLeft: 10,
		minWidth: 40,
		alignItems: "center",
	},
	toggleButtonActive: {
		backgroundColor: "#FFF",
	},
	toggleButtonText: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#FFF",
	},
	toggleButtonTextActive: {
		color: "#28A745",
	},
	balanceLabel: {
		fontSize: 14,
		color: "#E3F2FD",
		marginBottom: 5,
	},
	balanceAmount: {
		fontSize: 36,
		fontWeight: "bold",
		color: "#FFF",
	},
	testBlock: {
		backgroundColor: "#FFF9E6",
		margin: 15,
		padding: 15,
		borderRadius: 10,
		borderLeftWidth: 4,
		borderLeftColor: "#FFC107",
	},
	testTitle: {
		fontSize: 20,
		color: "#333",
		marginBottom: 8,
	},
	testDescription: {
		fontSize: 14,
		color: "#666",
		marginBottom: 4,
	},
	testHint: {
		fontSize: 12,
		color: "#999",
		fontStyle: "italic",
	},
	section: {
		backgroundColor: "#FFF",
		margin: 15,
		padding: 15,
		borderRadius: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#333",
		marginBottom: 15,
	},
	emptyText: {
		textAlign: "center",
		color: "#888",
		fontSize: 14,
		fontStyle: "italic",
		paddingVertical: 20,
	},
});