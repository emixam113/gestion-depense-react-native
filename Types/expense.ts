import { Category } from './category';
import { User } from './user';

// ─── Type reçu du backend ──────────────────────────────────────
export type Expense = {
  id: number;
  label: string;
  amount: string;             // Le backend renvoie une string ex: "-125.00"
  type: 'expense' | 'income';
  date: string;
  userId: number;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  category: Category;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'birthDate'>;
};

// ─── Type pour créer une dépense (envoi au backend) ───────────
export type CreateExpenseDto = {
  label: string;
  amount: number;             // On envoie un nombre
  type: 'expense' | 'income';
  categoryId: number;
  date: string;
};

// ─── Type pour modifier une dépense (envoi au backend) ────────
export type UpdateExpenseDto = Partial<CreateExpenseDto>;

// ─── Type pour le formulaire UI ───────────────────────────────
export interface ExpenseFormData {
  id?: number;
  description: string;        // Le formulaire utilise "description"
  amount: number;
  category: string;
  type: 'expense' | 'income';
  date?: string;
}