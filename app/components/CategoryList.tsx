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
// Importation de tes fonctions depuis ton fichier Api.tsx
import { getWithAuth, deleteWithAuth } from "../services/Api";

export interface Category{
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

export default function CategoryList({
	token,
	onCategoryAdded,
	onDeleteCategory,
}: CategoryListProps) {
	const { colors } = useTheme();
	const { fontFamily } = useAccessibility();

	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);

	// 1. Charger les catégories au montage du composant
	useEffect(() => {
		const fetchCategories = async () => {
			// Si pas de token, on ne tente même pas l'appel
			if (!token) {
				setLoading(false);
				return;
			}

			try {
				// On utilise ta fonction générique qui gère déjà l'IP et le Token
				// Note : J'utilise "/category" (singulier) car c'est lestandard NestJS
				const data = await getWithAuth<Category[]>("/categories");
				setCategories(data);
			} catch (error: any) {
				console.error("Erreur fetch catégories:", error.message);
				// Si l'erreur est une 404, tenteavec "/categories" (pluriel)
				if (error.message.includes("404")) {
					console.warn("Tentative avec le pluriel /categories...");
				}
				Alert.alert("Erreur", "Impossible de charger les catégories");
			} finally {setLoading(false);
			}
		};

		fetchCategories();
	}, [token]);

	// 2. Supprimer une catégorie
	const handleDelete = async (id: number, name: string) => {
		Alert.alert(
			"Confirmation",`Voulez-vous vraiment supprimer la catégorie "${name}" ?`,
			[
				{ text: "Annuler", style: "cancel" },
				{
					text: "Supprimer",
					style: "destructive",
					onPress: async () => {
						try {// Utilisation de ta fonction deleteWithAuth
							await deleteWithAuth(`/category/${id}`);

							// Mise à jour locale de la liste
							setCategories((prev) => prev.filter((c) => c.id !== id));
							onDeleteCategory?.(id);
							Alert.alert("Succès", "Catégorie supprimée");
						} catch (error: any) {
							console.error("Erreur suppression:", error.message);
							Alert.alert("Erreur", "Impossible de supprimer la catégorie");
						}
					}
				},
			]);
	};

	// Séparer les catégories pour l'affichage
	const defaultCategories = categories.filter((c) => c.isDefault);
	const userCategories = categories.filter((c) => !c.isDefault);

	if (loading) {
		return (<View style={[styles.container, { backgroundColor: colors.surface, justifyContent: 'center' }]}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={{ textAlign: 'center', marginTop: 10, color: colors.text }}>Chargement...</Text>
			</View>
		);
	}

	return (
		<ScrollView style={[styles.container, { backgroundColor: colors.surface }]}>
			{/* Section : Catégories par défaut (Système) */}
			<Text style={[styles.sectionTitle, { fontFamily: fontFamily.semiBold, color: colors.text }]}>
				🔒 Catégories par défaut
			</Text>

			<View style={styles.categoryList}>
				{defaultCategories.length === 0 ? (
					<Text style={[styles.emptyText, { fontFamily: fontFamily.regular, color: colors.textSecondary }]}>
						Aucune catégorie par défaut trouvée.
					</Text>
				) : (
					defaultCategories.map((cat) => (
						<View
							key={`default-${cat.id}`}
							style={[styles.categoryItem, { borderBottomColor: colors.border }]}
						>
							<View style={styles.categoryInfo}>
								<View style={[styles.colorDot, { backgroundColor: cat.color }]} />
								<Text style={[styles.categoryName, { fontFamily: fontFamily.regular, color: colors.text }]}>{cat.name}
								</Text>
							</View>
							<Text style={[styles.defaultLabel, { fontFamily: fontFamily.regular, color: colors.textSecondary }]}>
								(système)
							</Text>
						</View>
					))
				)}</View>

			{/* Section : Catégories personnalisées (Utilisateur) */}
			<Text style={[styles.sectionTitle, { fontFamily: fontFamily.semiBold, color: colors.text }]}>
				✏️ Mes catégories
			</Text>

			<View style={styles.categoryList}>
				{userCategories.length === 0 ? (
					<Text style={[styles.emptyText, { fontFamily: fontFamily.regular, color: colors.textSecondary }]}>
						Vous n'avez pas encore créé de catégorie.
					</Text>
				) : (
					userCategories.map((cat) => (
						<View
							key={`user-${cat.id}`}
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
		flex: 1,
		padding: 16,
		borderRadius: 8,
	},
	sectionTitle: {fontSize: 16,
		marginTop: 20,
		marginBottom: 10,
		textTransform: 'uppercase',
		letterSpacing: 1,
	},
	categoryList: {
		marginBottom: 10,
	},
	categoryItem: {flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 15,
		borderBottomWidth: 1,
	},
	categoryInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	colorDot: {
		width: 18,
		height: 18,
		borderRadius: 9,
		marginRight: 12,
	},
	categoryName: {
		fontSize:16,
		flex: 1,
	},
	defaultLabel: {
		fontSize: 12,
		fontStyle: 'italic',
	},
	deleteButton: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 6,
	},
	deleteButtonText: {
		color: '#FFF',
		fontSize: 12,
	},
	emptyText: {
		fontSize: 14,
		fontStyle: 'italic',
		paddingVertical: 10,paddingLeft: 10,
	},
});