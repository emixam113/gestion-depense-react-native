import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Alert,
	ActivityIndicator
} from "react-native";
import { deleteWithAuth } from "../services/Api";
import type { Expense } from "../Types";  // ✅ Import du type centralisé

type ExpenseListProps = {
	expenses: Expense[];
	onDeleteSuccess: (deletedId: number) => void;
};

// Composant pour chaque élément de la liste
function ExpenseItem({ item, onDeleteSuccess }: { item: Expense; onDeleteSuccess: (id: number) => void }) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = () => {
		Alert.alert(
			"Confirmation",
			`Voulez-vous vraiment supprimer "${item.label}" ?`,  // ✅ Utilise label
			[
				{ text: "Annuler", style: "cancel" },
				{
					text: "Supprimer",
					style: "destructive",
					onPress: async () => {
						setIsDeleting(true);
						try {
							await deleteWithAuth(`/expenses/${item.id}`);
							onDeleteSuccess(item.id);
							Alert.alert("Succès", "Transaction supprimée.");
						} catch (error: any) {
							console.error("Erreur suppression:", error.message);
							Alert.alert("Erreur", `Impossible de supprimer la transaction : ${error.message}`);
						} finally {
							setIsDeleting(false);
						}
					}
				},
			]
		);
	};

	const isIncome = item.type === "income";
	// ✅ Garder le signe du backend, juste convertir en nombre
	const amountValue = parseFloat(item.amount) || 0;
	const displayAmount = Math.abs(amountValue);  // Pour l'affichage positif

	return (
		<View style={styles.item}>
			<View style={styles.detailsContainer}>
				<Text style={styles.typeIcon}>{isIncome ? "💰" : "💸"}</Text>

				<View style={styles.textContainer}>
					{/* ✅ Utilise label du backend */}
					<Text style={styles.descriptionText}>{item.label}</Text>
					<Text style={styles.category}>{item.category.name}</Text>
				</View>

				<Text style={[styles.amountText, isIncome ? styles.income : styles.expense]}>
					{isIncome ? "+" : "-"} {displayAmount.toFixed(2)} €
				</Text>
			</View>

			<TouchableOpacity
				style={styles.deleteButton}
				onPress={handleDelete}
				disabled={isDeleting}
			>
				{isDeleting ? (
					<ActivityIndicator color="#fff" size="small" />
				) : (
					<Text style={styles.deleteButtonText}>🗑️</Text>
				)}
			</TouchableOpacity>
		</View>
	);
}

// Composant principal
export default function ExpenseList({ expenses, onDeleteSuccess }: ExpenseListProps) {
	if (!expenses || expenses.length === 0) {
		return (
			<Text style={styles.emptyText}>Aucune transaction pour le moment</Text>
		);
	}

	return (
		<View style={styles.list}>
			{expenses.map((item) => (
				<ExpenseItem key={item.id.toString()} item={item} onDeleteSuccess={onDeleteSuccess} />
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	list: {
		paddingBottom: 20,
	},
	item: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#fff",
		padding: 12,
		marginVertical: 6,
		borderRadius: 8,
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	detailsContainer: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	typeIcon: {
		fontSize: 20,
		marginRight: 10,
	},
	textContainer: {
		flex: 1,
		marginRight: 10,
	},
	descriptionText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
	},
	category: {
		fontSize: 12,
		color: "#666",
		marginTop: 2,
	},
	amountText: {
		fontSize: 16,
		fontWeight: "bold",
	},
	income: {
		color: "#2CC26D",
	},
	expense: {
		color: "#FF6B6B",
	},
	deleteButton: {
		width: 40,
		height: 40,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#FF6B6B",
		borderRadius: 5,
		marginLeft: 10,
	},
	deleteButtonText: {
		fontSize: 18,
	},
	emptyText: {
		fontSize: 16,
		textAlign: "center",
		marginTop: 20,
		color: "#888",
		fontStyle: "italic",
	},
});