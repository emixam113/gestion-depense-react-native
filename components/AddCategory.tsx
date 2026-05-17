import React, { useState } from "react";
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	TouchableOpacity,
	Alert,
	ScrollView
} from "react-native";
import { useTheme } from '../Context/ThemeContext';
import { useAccessibility } from '../Context/Accessibility';
import { createCategory } from '../services/Api'; // Vérifie que le chemin est correct
import type { Category } from '../Types';

interface Props {
	token: string | null; // Reçu du Dashboard
	onCategoryAdded?: (category: Category) => void;
}

const PRESET_COLORS = [
	{ name: 'Vert', hex: '#2CC26D' },
	{ name: 'Bleu', hex: '#3B82F6' },
	{ name: 'Rouge', hex: '#EF4444' },
	{ name: 'Jaune', hex: '#F59E0B' },
	{ name: 'Violet', hex: '#8B5CF6' },
	{ name: 'Rose', hex: '#EC4899' },
	{ name: 'Orange', hex: '#F97316' },
	{ name: 'Cyan', hex: '#06B6D4' },
	{ name: 'Indigo', hex: '#6366F1' },
	{ name: 'Lime', hex: '#84CC16' },
];

const AddCategory: React.FC<Props> = ({ token, onCategoryAdded }) => {
	const { colors, isDark } = useTheme();
	const { fontFamily } = useAccessibility();

	const [name, setName] = useState("");
	const [color, setColor] = useState("#2CC26D");
	const [customMode, setCustomMode] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (!name.trim()) {
			Alert.alert("Erreur", "Veuillez donner un nom à la catégorie.");
			return;
		}

		setIsSubmitting(true);
		try {
			// On utilise ta fonction Api.tsx : createCategory(name, color, icon)
			const newCat = await createCategory(name.trim(), color, "tag");

			Alert.alert("Succès", `La catégorie "${newCat.name}" a été créée !`);

			// Reset du formulaire
			setName("");
			setCustomMode(false);

			// Notification au Dashboard pour rafraîchir la liste
			if (onCategoryAdded) {
				onCategoryAdded(newCat);
			}
		} catch (error: any) {
			console.error("Erreur création catégorie:", error);
			Alert.alert("Erreur", error.message || "Impossible de créer la catégorie.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
			<Text style={[styles.title, { color: colors.text, fontFamily: fontFamily.bold }]}>
				Créer une catégorie
			</Text>

			<TextInput
				style={[styles.input, {
					backgroundColor: colors.background,
					color: colors.text,
					borderColor: colors.border,
					fontFamily: fontFamily.regular
				}]}
				placeholder="Nom de la catégorie"
				placeholderTextColor={colors.textSecondary}
				value={name}
				onChangeText={setName}
			/>

			{/* Sélecteur de mode de couleur */}
			<View style={styles.modeToggle}>
				<TouchableOpacity
					onPress={() => setCustomMode(false)}
					style={[styles.modeBtn, !customMode && { backgroundColor: colors.primary, borderColor: colors.primary }]}
				>
					<Text style={[styles.modeBtnText, !customMode && { color: '#FFF' }]}>Prédéfinies</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => setCustomMode(true)}
					style={[styles.modeBtn, customMode && { backgroundColor: colors.primary, borderColor: colors.primary }]}
				>
					<Text style={[styles.modeBtnText, customMode && { color: '#FFF' }]}>Custom</Text>
				</TouchableOpacity>
			</View>

			{!customMode ? (
				<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorList}>
					{PRESET_COLORS.map((item) => (
						<TouchableOpacity
							key={item.hex}
							onPress={() => setColor(item.hex)}
							style={[
								styles.colorCircle,
								{ backgroundColor: item.hex },
								color === item.hex && { borderWidth: 3, borderColor: colors.text }
							]}
						/>
					))}
				</ScrollView>
			) : (
				<View style={styles.customColorContainer}>
					<View style={[styles.colorPreview, { backgroundColor: color }]} />
					<TextInput
						style={[styles.input, { flex: 1, marginBottom: 0, color: colors.text, borderColor: colors.border }]}
						value={color}
						onChangeText={setColor}
						placeholder="#HEX (ex: #FF5500)"
						autoCapitalize="none"
					/>
				</View>
			)}

			<TouchableOpacity
				style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }]}
				onPress={handleSubmit}
				disabled={isSubmitting}
			>
				<Text style={[styles.submitBtnText, { fontFamily: fontFamily.bold }]}>
					{isSubmitting ? "CRÉATION..." : "AJOUTER LA CATÉGORIE"}
				</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 20,
		padding: 20,
		borderRadius: 15,
		borderWidth: 1,
		marginTop: 10,
		marginBottom: 20,
	},
	title: {
		fontSize: 16,
		marginBottom: 15,
		textTransform: 'uppercase',
	},
	input: {
		borderWidth: 1,
		borderRadius: 10,
		padding: 12,
		fontSize: 16,
		marginBottom: 15,
	},
	modeToggle: {
		flexDirection: 'row',
		gap: 10,
		marginBottom: 15,
	},
	modeBtn: {
		flex: 1,
		paddingVertical: 8,
		borderRadius: 8,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#DDD',
	},
	modeBtnText: {
		fontSize: 13,
		fontWeight: '600',
	},
	colorList: {
		marginBottom: 20,
	},
	colorCircle: {
		width: 40,
		height: 40,
		borderRadius: 20,
		marginRight: 10,
	},
	customColorContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginBottom: 20,
	},
	colorPreview: {
		width: 45,
		height: 45,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#DDD',
	},
	submitBtn: {
		paddingVertical: 15,
		borderRadius: 12,
		alignItems: 'center',
	},
	submitBtnText: {
		color: '#FFF',
		fontSize: 14,
	},
});

export default AddCategory;