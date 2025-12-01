import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";

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

		// reset form
		setDescription("");
		setAmount("");
		setCategory(categories[0] || "");
		setType("expense");
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>➕ Ajouter une transaction</Text>
			<TextInput
				style={styles.input}
				placeholder="Description"
				value={description}
				onChangeText={setDescription}
			/>
			<TextInput
				style={styles.input}
				placeholder="Montant"
				keyboardType="numeric"
				value={amount}
				onChangeText={(text) => setAmount(text.replace(/[^0-9,.]/g, ""))}
			/>
			<Text style={styles.label}>Catégorie :</Text>
			{categories.length > 0 ? (
				<View style={styles.pickerContainer}>
					<Picker selectedValue={category} onValueChange={(itemValue) => setCategory(itemValue)}>
						{categories.map((cat) => (
							<Picker.Item key={cat} label={cat} value={cat} />
						))}
					</Picker>
				</View>
			) : (
				<Text style={styles.noCategoryText}>Veuillez ajouter une catégorie.</Text>
			)}
			<View style={styles.row}>
				<TouchableOpacity
					style={[styles.typeButton, type === "income" && styles.activeIncome]}
					onPress={() => setType("income")}
				>
					<Text style={[styles.typeText, type !== "income" && styles.inactiveText]}>Revenu</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.typeButton, type === "expense" && styles.activeExpense]}
					onPress={() => setType("expense")}
				>
					<Text style={[styles.typeText, type !== "expense" && styles.inactiveText]}>Dépense</Text>
				</TouchableOpacity>
			</View>
			<TouchableOpacity
				style={[styles.addButton, categories.length === 0 && styles.disabledButton]}
				onPress={handleSubmit}
				disabled={categories.length === 0}
			>
				<Text style={styles.addButtonText}>Ajouter</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles=StyleSheet.create({
	container: {
		backgroundColor: "#fff",
		padding: 16,
		borderRadius: 12,
		marginVertical: 10,
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10
	},
	input: {
		backgroundColor: "#F2F2F2",
		padding: 10,
		borderRadius: 8,
		marginBottom: 10,
	},
	label: {
		fontWeight: "bold",
		marginTop: 10,
		color: "#555",
	},
	pickerContainer: {
		borderColor: "#E0E0E0",
		borderWidth: 1,
		borderRadius: 8,
		marginBottom:10,
	},
	noCategoryText: {
		color: "#FF6B6B",
		fontStyle: "italic",
		marginTop: 10,
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginVertical: 10,
	},
	typeButton: {
		padding: 10,
		borderRadius: 8,
		backgroundColor: "#DDD",
		width: "45%",
		alignItems: "center",
	},

	activeIncome: {
		backgroundColor: "#2CC26D",
	},
	activeExpense: {
		backgroundColor: "#FF6B6B",
	},
	typeText: {
		color: "#FFF",
		fontWeight: "bold",
	},
	inactiveText: {
		color: "#333",
	},
	addButton: {
		backgroundColor: "#2CC26D",
		padding: 10,
		borderRadius: 8,
		alignItems: "center",
		marginTop: 10,
	},
	disabledButton: {
		backgroundColor: "#A9A9A9",
	},
	addButtonText: {
		color: "#FFF",
		fontWeight: "bold",
		fontSize: 16
	},
})