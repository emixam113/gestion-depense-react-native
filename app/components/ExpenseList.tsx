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
import { useTheme } from '../Context/ThemeContext';
import { useAccessibility } from '../Context/Accessibility';
import EditExpenseModal from './EditExpenseModale'
import type { Expense } from "../Types";

type ExpenseListProps = {
	expenses: Expense[];
	onDeleteSuccess: (deletedId: number) => void;
	onEditSuccess?: (updated: Expense) => void;
	token: string | null;
};

// Formater la date
const formatDate = (dateString: string): string => {
	const date = new Date(dateString);
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	// Réinitialiser les heures pour comparer juste les dates
	today.setHours(0, 0, 0, 0);
	yesterday.setHours(0, 0, 0, 0);
	date.setHours(0, 0, 0, 0);

	if (date.getTime() === today.getTime()) {
		return "Aujourd'hui";
	} else if (date.getTime() === yesterday.getTime()) {
		return "Hier";
	} else {
		return date.toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'short',
			year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
		});
	}
};

// Composant pour chaque élément de la liste
function ExpenseItem({
	item,
	onDeleteSuccess,
	onEdit,
	colors,
	fontFamily
}: {
	item: Expense;
	onDeleteSuccess: (id: number) => void;
	onEdit: (expense: Expense) => void;
	colors: any;
	fontFamily: any;
}) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = () => {
		Alert.alert(
			"Confirmation",
			`Voulez-vous vraiment supprimer "${item.label}" ?`,
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
	const amountValue = parseFloat(item.amount) || 0;
	const displayAmount = Math.abs(amountValue);

	return (
		<View style={[styles.item, { backgroundColor: colors.cardBackground }]}>
			<View style={styles.detailsContainer}>
				<Text style={styles.typeIcon}>{isIncome ? "💰" : "💸"}</Text>

				<View style={styles.textContainer}>
					<Text style={[
						styles.descriptionText,
						{ fontFamily: fontFamily.semiBold, color: colors.text }
					]}>
						{item.label}
					</Text>
					<View style={styles.metaRow}>
						<Text style={[
							styles.category,
							{ fontFamily: fontFamily.regular, color: colors.textSecondary }
						]}>
							{item.category.name}
						</Text>
						<Text style={[
							styles.separator,
							{ color: colors.textSecondary }
						]}>
							•
						</Text>
						<Text style={[
							styles.date,
							{ fontFamily: fontFamily.regular, color: colors.textSecondary }
						]}>
							{formatDate(item.date)}
						</Text>
					</View>
				</View>

				<Text style={[
					styles.amountText,
					{ fontFamily: fontFamily.bold },
					isIncome ? styles.income : styles.expense
				]}>
					{isIncome ? "+" : "-"} {displayAmount.toFixed(2)} €
				</Text>
			</View>

			<View style={styles.buttonContainer}>
				{/* Bouton Modifier */}
				<TouchableOpacity
					style={[styles.editButton, { backgroundColor: colors.primary }]}
					onPress={() => onEdit(item)}
				>
					<Text style={styles.buttonIcon}>✏️</Text>
				</TouchableOpacity>

				{/* Bouton Supprimer */}
				<TouchableOpacity
					style={[styles.deleteButton, { backgroundColor: colors.error }]}
					onPress={handleDelete}
					disabled={isDeleting}
				>
					{isDeleting ? (
						<ActivityIndicator color="#fff" size="small" />
					) : (
						<Text style={styles.buttonIcon}>🗑️</Text>
					)}
				</TouchableOpacity>
			</View>
		</View>
	);
}

// Composant principal
export default function ExpenseList({
	expenses,
	onDeleteSuccess,
	onEditSuccess,
	token
}: ExpenseListProps) {
	const { colors } = useTheme();
	const { fontFamily } = useAccessibility();
	const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

	const handleEditSuccess = (updated: Expense) => {
		if (onEditSuccess) {
			onEditSuccess(updated);
		}
		setEditingExpense(null);
	};

	if (!expenses || expenses.length === 0) {
		return (
			<Text style={[
				styles.emptyText,
				{ fontFamily: fontFamily.regular, color: colors.textSecondary }
			]}>
				Aucune transaction pour le moment
			</Text>
		);
	}

	return (
		<>
			<View style={styles.list}>
				{expenses.map((item) => (
					<ExpenseItem
						key={item.id.toString()}
						item={item}
						onDeleteSuccess={onDeleteSuccess}
						onEdit={setEditingExpense}
						colors={colors}
						fontFamily={fontFamily}
					/>
				))}
			</View>

			{/* Modal d'édition */}
			<EditExpenseModal
				visible={editingExpense !== null}
				expense={editingExpense}
				onClose={() => setEditingExpense(null)}
				onSave={handleEditSuccess}
				token={token}
			/>
		</>
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
		marginBottom: 4,
	},
	metaRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	category: {
		fontSize: 12,
	},
	separator: {
		fontSize: 12,
		marginHorizontal: 2,
	},
	date: {
		fontSize: 12,
	},
	amountText: {
		fontSize: 16,
		marginRight: 10,
	},
	income: {
		color: "#2CC26D",
	},
	expense: {
		color: "#FF6B6B",
	},
	buttonContainer: {
		flexDirection: "row",
		gap: 6,
	},
	editButton: {
		width: 36,
		height: 36,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 6,
	},
	deleteButton: {
		width: 36,
		height: 36,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 6,
	},
	buttonIcon: {
		fontSize: 16,
	},
	emptyText: {
		fontSize: 16,
		textAlign: "center",
		marginTop: 20,
		fontStyle: "italic",
	},
});