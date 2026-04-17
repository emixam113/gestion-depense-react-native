import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	SectionList // Remplacement de ScrollView pour la performance
} from "react-native";
import { useTheme } from '../../Context/ThemeContext';
import { useAccessibility } from '../../Context/Accessibility';
import { getWithAuth, deleteWithAuth } from "../../services/Api";

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

export default function CategoryList({
	token,
	onCategoryAdded,
	onDeleteCategory,
}: CategoryListProps) {
	const { colors } = useTheme();
	const { fontFamily } = useAccessibility();

	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);

	// 1. Charger les catégories
	useEffect(() => {
		const fetchCategories = async () => {
			if (!token) {
				setLoading(false);
				return;
			}
			try {
				const data = await getWithAuth<Category[]>("/categories");
				setCategories(data);
			} catch (error: any) {
				console.error("Erreur fetch catégories:", error.message);
				Alert.alert("Erreur", "Impossible de charger les catégories");
			} finally {
				setLoading(false);
			}
		};
		fetchCategories();
	}, [token]);

	// 2. Supprimer une catégorie
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
							await deleteWithAuth(`/category/${id}`);
							setCategories((prev) => prev.filter((c) => c.id !== id));
							onDeleteCategory?.(id);
							Alert.alert("Succès", "Catégorie supprimée");
						} catch (error: any) {
							Alert.alert("Erreur", "Impossible de supprimer la catégorie");
						}
					}
				},
			]);
	};

	// 3. Préparation des sections pour la SectionList
	const sections = [
		{
			title: "🔒 Catégories par défaut",
			data: categories.filter((c) => c.isDefault),
			type: 'default'
		},
		{
			title: "✏️ Mes catégories",
			data: categories.filter((c) => !c.isDefault),
			type: 'user'
		},
	];

	// 4. Rendu d'un élément (Item)
	const renderCategoryItem = ({ item }: { item: Category }) => (
		<View style={[styles.categoryItem, { borderBottomColor: colors.border }]}>
			<View style={styles.categoryInfo}>
				<View style={[styles.colorDot, { backgroundColor: item.color }]} />
				<Text style={[styles.categoryName, { fontFamily: fontFamily.regular, color: colors.text }]}>
					{item.name}
				</Text>
			</View>

			{item.isDefault ? (
				<Text style={[styles.defaultLabel, { fontFamily: fontFamily.regular, color: colors.textSecondary }]}>
					(système)
				</Text>
			) : (
				<TouchableOpacity
					onPress={() => handleDelete(item.id, item.name)}
					style={[styles.deleteButton, { backgroundColor: colors.error }]}
				>
					<Text style={[styles.deleteButtonText, { fontFamily: fontFamily.semiBold }]}>
						Supprimer
					</Text>
				</TouchableOpacity>
			)}
		</View>
	);

	if (loading) {
		return (
			<View style={[styles.container, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={{ marginTop: 10, color: colors.text, fontFamily: fontFamily.regular }}>Chargement...</Text>
			</View>
		);
	}

	return (
		<SectionList
			style={[styles.container, { backgroundColor: colors.surface }]}
			sections={sections}
			keyExtractor={(item) => item.id.toString()}
			renderItem={renderCategoryItem}
			// Rendu des titres de sections
			renderSectionHeader={({ section: { title, data } }) => (
				<View style={{ backgroundColor: colors.surface }}>
					<Text style={[styles.sectionTitle, { fontFamily: fontFamily.semiBold, color: colors.text }]}>
						{title}
					</Text>
					{data.length === 0 && (
						<Text style={[styles.emptyText, { fontFamily: fontFamily.regular, color: colors.textSecondary }]}>
							Aucun élément dans cette section.
						</Text>
					)}
				</View>
			)}
			// Optimisation pour le scroll
			stickySectionHeadersEnabled={false}
			initialNumToRender={15}
		/>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
		borderRadius: 8,
	},
	sectionTitle: {
		fontSize: 14,
		marginTop: 25,
		marginBottom: 10,
		textTransform: 'uppercase',
		letterSpacing: 1.2,
	},
	categoryItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 14,
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
		marginRight: 12,
	},
	categoryName: {
		fontSize: 16,
		flex: 1,
	},
	defaultLabel: {
		fontSize: 12,
		fontStyle: 'italic',
	},
	deleteButton: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 8,
	},
	deleteButtonText: {
		color: '#FFF',
		fontSize: 12,
	},
	emptyText: {
		fontSize: 14,
		fontStyle: 'italic',
		paddingVertical: 10,
		paddingLeft: 10,
	},
});