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
import { Category } from '../Types/category';
import { useTheme } from '../Context/ThemeContext';
import { useAccessibility } from '../Context/Accessibility';
import {API_URL} from '../services/Api';

interface Props {
	token: string | null;
	onCategoryAdded?: (category: Category) => void;
}


// Couleurs prédéfinies
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
	const { colors } = useTheme();
	const { fontFamily } = useAccessibility();

	const [name, setName] = useState("");
	const [color, setColor] = useState("#2CC26D");
	const [customMode, setCustomMode] = useState(false); // Mode personnalisé ou prédéfini

	const handleSubmit = async () => {
		if (!token) {
			Alert.alert("Erreur d'authentification", "Veuillez vous connecter pour ajouter une catégorie.");
			return;
		}
		if (!name.trim()) {
			Alert.alert("Erreur", "Le nom de la catégorie est requis.");
			return;
		}

		if (!/^#([0-9A-Fa-f]{3}){1,2}$/.test(color)) {
			Alert.alert("Erreur de couleur", "Veuillez entrer un code HEX valide (ex: #RRGGBB).");
			return;
		}

		try {
			const res = await fetch(`${API_URL}/categories`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ name, color }),
			});

			if (res.status === 401) {
				throw new Error("Accès refusé. Token invalide ou expiré.");
			}
			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || "Erreur lors de l'ajout de la catégorie.");
			}

			const newCategory: Category = await res.json();

			setName("");
			setColor("#2CC26D");
			Alert.alert("Succès", `Catégorie '${newCategory.name}' ajoutée.`);

			onCategoryAdded?.(newCategory);

		} catch (err) {
			console.error("Erreur ajout catégorie:", err);
			Alert.alert("Erreur API", err instanceof Error ? err.message : "Une erreur inconnue s'est produite.");
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.surface }]}>
			<Text style={[styles.heading, { fontFamily: fontFamily.semiBold, color: colors.text }]}>
				➕ Ajouter une catégorie
			</Text>

			{/* Nom de la catégorie */}
			<TextInput
				style={[
					styles.input,
					{
						fontFamily: fontFamily.regular,
						backgroundColor: colors.inputBackground,
						color: colors.text,
						borderColor: colors.border
					}
				]}
				placeholder="Nom de la catégorie"
				placeholderTextColor={colors.textSecondary}
				value={name}
				onChangeText={setName}
				autoCapitalize="words"
			/>

			{/* Toggle entre prédéfini et personnalisé */}
			<View style={styles.modeToggle}>
				<TouchableOpacity
					style={[
						styles.modeButton,
						!customMode && styles.modeButtonActive,
						{
							borderColor: colors.border,
							backgroundColor: !customMode ? colors.primary : 'transparent'
						}
					]}
					onPress={() => setCustomMode(false)}
				>
					<Text style={[
						styles.modeButtonText,
						{ fontFamily: fontFamily.regular },
						!customMode && styles.modeButtonTextActive
					]}>
						Prédéfinies
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.modeButton,
						customMode && styles.modeButtonActive,
						{
							borderColor: colors.border,
							backgroundColor: customMode ? colors.primary : 'transparent'
						}
					]}
					onPress={() => setCustomMode(true)}
				>
					<Text style={[
						styles.modeButtonText,
						{ fontFamily: fontFamily.regular },
						customMode && styles.modeButtonTextActive
					]}>
						Personnalisée
					</Text>
				</TouchableOpacity>
			</View>

			{/* Couleurs prédéfinies */}
			{!customMode && (
				<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorGrid}>
					{PRESET_COLORS.map((preset) => (
						<TouchableOpacity
							key={preset.hex}
							style={[
								styles.colorCircle,
								{ backgroundColor: preset.hex },
								color === preset.hex && styles.colorCircleSelected
							]}
							onPress={() => setColor(preset.hex)}
						>
							{color === preset.hex && (
								<Text style={styles.checkmark}>✓</Text>
							)}
						</TouchableOpacity>
					))}
				</ScrollView>
			)}

			{/* Couleur personnalisée */}
			{customMode && (
				<View style={[styles.customColorRow, { borderColor: colors.border }]}>
					<View style={[styles.colorPreview, { backgroundColor: color }]} />
					<TextInput
						style={[
							styles.colorInput,
							{
								fontFamily: fontFamily.regular,
								color: colors.text,
								backgroundColor: colors.inputBackground
							}
						]}
						placeholder="#RRGGBB"
						placeholderTextColor={colors.textSecondary}
						value={color}
						onChangeText={setColor}
						maxLength={7}
						autoCapitalize="none"
					/>
				</View>
			)}

			{/* Aperçu */}
			<View style={styles.preview}>
				<Text style={[styles.previewLabel, { fontFamily: fontFamily.regular, color: colors.textSecondary }]}>
					Aperçu :
				</Text>
				<View style={[styles.previewTag, { backgroundColor: color }]}>
					<Text style={[styles.previewText, { fontFamily: fontFamily.semiBold }]}>
						{name || "Catégorie"}
					</Text>
				</View>
			</View>

			{/* Bouton Ajouter */}
			<TouchableOpacity
				style={[styles.button, { backgroundColor: colors.success }]}
				onPress={handleSubmit}
			>
				<Text style={[styles.buttonText, { fontFamily: fontFamily.bold }]}>
					Ajouter
				</Text>
			</TouchableOpacity>
		</View>
	);
};

export default AddCategory;

const styles = StyleSheet.create({
	container: {
		padding: 16,
		borderRadius: 8,
		marginVertical: 10,
	},
	heading: {
		fontSize: 18,
		marginBottom: 12,
	},
	input: {
		borderWidth: 1,
		padding: 12,
		borderRadius: 6,
		fontSize: 16,
		marginBottom: 12,
	},
	modeToggle: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 12,
	},
	modeButton: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 6,
		alignItems: 'center',
		borderWidth: 1,
	},
	modeButtonActive: {
		// La couleur de fond est gérée dynamiquement
	},
	modeButtonText: {
		fontSize: 14,
		color: '#666',
	},
	modeButtonTextActive: {
		color: '#FFF',
	},
	colorGrid: {
		marginBottom: 12,
	},
	colorCircle: {
		width: 50,
		height: 50,
		borderRadius: 25,
		marginRight: 10,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 2,
		borderColor: 'transparent',
	},
	colorCircleSelected: {
		borderColor: '#000',
		borderWidth: 3,
	},
	checkmark: {
		color: '#FFF',
		fontSize: 24,
		fontWeight: 'bold',
		textShadowColor: 'rgba(0, 0, 0, 0.5)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 2,
	},
	customColorRow: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderRadius: 6,
		padding: 8,
		marginBottom: 12,
	},
	colorPreview: {
		width: 40,
		height: 40,
		borderRadius: 6,
		marginRight: 10,
		borderWidth: 1,
		borderColor: '#DDD',
	},
	colorInput: {
		flex: 1,
		padding: 8,
		fontSize: 16,
	},
	preview: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
		gap: 10,
	},
	previewLabel: {
		fontSize: 14,
	},
	previewTag: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
	},
	previewText: {
		color: '#FFF',
		fontSize: 14,
	},
	button: {
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 6,
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
	},
});