import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	ScrollView
} from "react-native";
import { useTheme } from '../Context/ThemeContext';
import { useAccessibility } from '../Context/Accessibility';

export interface Category {
	id: number;
	name: string;
	color: string;
	isDefault: boolean;
}

interface CategoryListProps {
	token: string | null;
	onCategoryAdded?: (category: Category) => void;
	onDeleteCategory?: (id: number) => void;
}

const BASE_API_URL = "http://192.168.1.39:3000";

export default function CategoryList({
	token,
	onCategoryAdded,
	onDeleteCategory,
}: CategoryListProps) {
	const { colors } = useTheme();
	const { fontFamily } = useAccessibility();

	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);

	// Charger les catégories
	useEffect(() => {
		const fetchCategories = async () => {
			if (!token) {
				setLoading(false);
				return;
			}

			try {
				const res = await fetch(`${BASE_API_URL}/categories`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!res.ok) {
					throw new Error("Erreur lors du chargement des catégories");
				}

				const data = await res.json();
				setCategories(data);
			} catch (error) {
				console.error("Erreur fetch catégories:", error);
				Alert.alert("Erreur", "Impossible de charger les catégories");
			} finally {
				setLoading(false);
			}
		};

		fetchCategories();
	}, [token]);

	// Supprimer une catégorie
	const handleDelete = async (id: number, name: string) => {
		Alert.alert(
			"Confirmation",
			`Voulez-vous vraiment supprimer la catégorie "${name}" ?`,
			[
				{ text: "Annuler", style: "cancel" },
				{
					text: "Supprimer",
					style: "destructive",
					onPress: async () => {
						try {
							const res = await fetch(`${BASE_API_URL}/categories/${id}`, {
								method: "DELETE",
								headers: { Authorization: `Bearer ${token}` },
							});

							if (!res.ok) {
								throw new Error("Erreur lors de la suppression");
							}

							setCategories((prev) => prev.filter((c) => c.id !== id));
							onDeleteCategory?.(id);
							Alert.alert("Succès", "Catégorie supprimée");
						} catch (error) {
							console.error("Erreur suppression:", error);
							Alert.alert("Erreur", "Impossible de supprimer la catégorie");
						}
					}
				},
			]
		);
	};

	// Séparer les catégories
	const defaultCategories = categories.filter((c) => c.isDefault);
	const userCategories = categories.filter((c) => !c.isDefault);

	if (loading) {
		return (
			<View style={[styles.container, { backgroundColor: colors.surface }]}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
		<ScrollView style={[styles.container, { backgroundColor: colors.surface }]}>
			{/* Catégories par défaut */}
			<Text style={[styles.sectionTitle, { fontFamily: fontFamily.semiBold, color: colors.text }]}>
				🔒 Catégories par défaut
			</Text>

			<View style={styles.categoryList}>
				{defaultCategories.length === 0 ? (
					<Text style={[styles.emptyText, { fontFamily: fontFamily.regular, color: colors.textSecondary }]}>
						Aucune catégorie par défaut
					</Text>
				) : (
					defaultCategories.map((cat) => (
						<View
							key={cat.id}
							style={[styles.categoryItem, { borderBottomColor: colors.border }]}
						>
							<View style={styles.categoryInfo}>
								<View style={[styles.colorDot, { backgroundColor: cat.color }]} />
								<Text style={[styles.categoryName, { fontFamily: fontFamily.regular, color: colors.text }]}>
									{cat.name}
								</Text>
							</View>
							<Text style={[styles.defaultLabel, { fontFamily: fontFamily.regular, color: colors.textSecondary }]}>
								(non modifiable)
							</Text>
						</View>
					))
				)}
			</View>

			{/* Catégories personnalisées */}
			<Text style={[styles.sectionTitle, { fontFamily: fontFamily.semiBold, color: colors.text }]}>
				✏️ Catégories personnalisées
			</Text>

			<View style={styles.categoryList}>
				{userCategories.length === 0 ? (
					<Text style={[styles.emptyText, { fontFamily: fontFamily.regular, color: colors.textSecondary }]}>
						Aucune catégorie personnalisée
					</Text>
				) : (
					userCategories.map((cat) => (
						<View
							key={cat.id}
							style={[styles.categoryItem, { borderBottomColor: colors.border }]}
						>
							<View style={styles.categoryInfo}>
								<View style={[styles.colorDot, { backgroundColor: cat.color }]} />
								<Text style={[styles.categoryName, { fontFamily: fontFamily.regular, color: colors.text }]}>
									{cat.name}
								</Text>
							</View>
							<TouchableOpacity
								onPress={() => handleDelete(cat.id, cat.name)}
								style={[styles.deleteButton, { backgroundColor: colors.error }]}
							>
								<Text style={[styles.deleteButtonText, { fontFamily: fontFamily.semiBold }]}>
									Supprimer
								</Text>
							</TouchableOpacity>
						</View>
					))
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		borderRadius: 8,
		marginVertical: 10,
	},
	sectionTitle: {
		fontSize: 16,
		marginTop: 12,
		marginBottom: 8,
	},
	categoryList: {
		marginBottom: 16,
	},
	categoryItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	categoryInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	colorDot: {
		width: 16,
		height: 16,
		borderRadius: 8,
		marginRight: 10,
	},
	categoryName: {
		fontSize: 15,
		flex: 1,
	},
	defaultLabel: {
		fontSize: 12,
		fontStyle: 'italic',
	},
	deleteButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 4,
	},
	deleteButtonText: {
		color: '#FFF',
		fontSize: 12,
	},
	emptyText: {
		fontSize: 14,
		fontStyle: 'italic',
		paddingVertical: 8,
	},
});