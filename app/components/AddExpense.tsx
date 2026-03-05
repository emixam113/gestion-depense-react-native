import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAccessibility } from '../Context/Accessibility';
import { useTheme } from '../Context/ThemeContext';

type TransactionType = "income" | "expense";

export interface Expense {
	id?: number;
	description: string;
	amount: number;
	category: string;
	type: TransactionType;
	date?: string;
}

interface AddExpenseProps {
	onAdd: (expense: Expense) => void;
	categories: string[];
}

export default function AddExpense({ onAdd, categories }: AddExpenseProps) {
	const { fontFamily } = useAccessibility();
	const { colors } = useTheme();

	const [description, setDescription] = useState("");
	const [amount, setAmount] = useState("");
	const [category, setCategory] = useState(categories[0] || "");
	const [type, setType] = useState<TransactionType>("expense");

	const handleSubmit = () => {
		const numericAmount = Number(amount.replace(",", "."));
		if (!description.trim() || isNaN(numericAmount) || numericAmount <= 0) {
			return Alert.alert("Erreur", "Veuillez entrer une description et un montant positif.");
		}
		if (!category) {
			return Alert.alert("Erreur", "Veuillez sélectionner une catégorie.");
		}

		const newExpense: Expense = {
			id: Date.now(),
			description: description.trim(),
			amount: numericAmount,
			category,
			type,
			date: new Date().toISOString(),
		};

		onAdd(newExpense);

		setDescription("");
		setAmount("");
		setCategory(categories[0] || "");
		setType("expense");
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
			<Text style={[styles.title, { fontFamily: fontFamily.bold, color: colors.text }]}>
				➕ Ajouter une transaction
			</Text>

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
				placeholder="Description"
				placeholderTextColor={colors.textSecondary}
				value={description}
				onChangeText={setDescription}
			/>

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
				placeholder="Montant"
				placeholderTextColor={colors.textSecondary}
				keyboardType="numeric"
				value={amount}
				onChangeText={(text) => setAmount(text.replace(/[^0-9,.]/g, ""))}
			/>

			<Text style={[styles.label, { fontFamily: fontFamily.bold, color: colors.text }]}>
				Catégorie :
			</Text>

			{categories.length > 0 ? (
				<View style={[styles.pickerContainer, {
					borderColor: colors.border,
					backgroundColor: colors.surface
				}]}>
					<Picker
						selectedValue={category}
						onValueChange={(itemValue) => setCategory(itemValue)}
						style={{ color: colors.text }}
						dropdownIconColor={colors.text}
					>
						{categories.map((cat) => (
							<Picker.Item key={cat} label={cat} value={cat} />
						))}
					</Picker>
				</View>
			) : (
				<Text style={[styles.noCategoryText, { fontFamily: fontFamily.regular, color: colors.error }]}>
					Veuillez ajouter une catégorie.
				</Text>
			)}

			<View style={styles.row}>
				<TouchableOpacity
					style={[
						styles.typeButton,
						type === "income" ? styles.activeIncome : {
							backgroundColor: colors.inputBackground,
							borderColor: colors.border
						}
					]}
					onPress={() => setType("income")}
				>
					<Text style={[
						styles.typeText,
						{ fontFamily: fontFamily.bold },
						type === "income" ? { color: '#FFF' } : { color: colors.textSecondary }
					]}>
						Revenu
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.typeButton,
						type === "expense" ? styles.activeExpense : {
							backgroundColor: colors.inputBackground,
							borderColor: colors.border
						}
					]}
					onPress={() => setType("expense")}
				>
					<Text style={[
						styles.typeText,
						{ fontFamily: fontFamily.bold },
						type === "expense" ? { color: '#FFF' } : { color: colors.textSecondary }
					]}>
						Dépense
					</Text>
				</TouchableOpacity>
			</View>

			<TouchableOpacity
				style={[
					styles.addButton,
					{ backgroundColor: colors.success },
					categories.length === 0 && { backgroundColor: colors.border, opacity: 0.5 }
				]}
				onPress={handleSubmit}
				disabled={categories.length === 0}
			>
				<Text style={[styles.addButtonText, { fontFamily: fontFamily.bold }]}>
					Ajouter
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 20,
		borderRadius: 16,
		marginVertical: 10,
	},
	title: {
		fontSize: 20,
		marginBottom: 16,
	},
	input: {
		padding: 14,
		borderRadius: 12,
		marginBottom: 16,
		fontSize: 16,
		borderWidth: 1,
	},
	label: {
		marginBottom: 8,
		fontSize: 16,
	},
	pickerContainer: {
		borderWidth: 1,
		borderRadius: 12,
		marginBottom: 16,
		overflow: 'hidden',
	},
	noCategoryText: {
		fontStyle: "italic",
		marginBottom: 16,
	},
	row: {
		flexDirection: "row",
		gap: 12,
		marginBottom: 16,
	},
	typeButton: {
		flex: 1,
		padding: 14,
		borderRadius: 12,
		alignItems: "center",
		borderWidth: 1,
	},
	activeIncome: {
		backgroundColor: "#2CC26D",
		borderColor: "#2CC26D",
	},
	activeExpense: {
		backgroundColor: "#FF6B6B",
		borderColor: "#FF6B6B",
	},
	typeText: {
		fontSize: 16,
	},
	addButton: {
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	addButtonText: {
		color: "#FFF",
		fontSize: 16,
	},
});