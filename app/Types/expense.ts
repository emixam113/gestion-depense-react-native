import { Category } from "@/app/Types/category";

// Type pour les dépenses REÇUES du backend (format réel de votre API)
export type Expense = {
	id: number;
	label: string;              // ✅ Backend utilise "label"
	amount: string;             // ✅ Backend renvoie une string "-125.00"
	type: "expense" | "income";
	date: string;
	userId: number;
	categoryId: number;
	createdAt: string;
	updatedAt: string;
	category: Category;
	user?: {                    // Optionnel
		id: number;
		firstName: string;
		lastName: string;
		birthDate: string;
		email: string;
	};
}

// Type pour CRÉER une nouvelle dépense (envoi au backend)
export type CreateExpenseDto = {
	label: string;              // ✅ Backend attend "label"
	amount: number;             // On envoie un nombre
	type: "expense" | "income";
	categoryId: number;
	date: string;
}

// Type pour le formulaire AddExpense (interface utilisateur)
export interface ExpenseFormData {
	id?: number;
	description: string;        // Le formulaire utilise "description"
	amount: number;
	category: string;
	type: "expense" | "income";
	date?: string;
}