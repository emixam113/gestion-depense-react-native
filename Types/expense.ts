// ─── Type reçu du backend ──────────────────────────────────────
export type Expense = {
  id: number;
  label: string;
  amount: string;
  type: 'expense' | 'income';
  date: string;
  userId: number;
  categoryId: number;
  isRecurring: boolean;      // ✅ AJOUTÉ
  createdAt: string;
  updatedAt: string;
  category: Category;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'birthDate'>;
};

// ─── Type pour créer une dépense (envoi au backend) ───────────
export type CreateExpenseDto = {
  label: string;
  amount: number;
  type: 'expense' | 'income';
  categoryId: number;
  date: string;
  isRecurring: boolean;      // ✅ AJOUTÉ
};

// ─── Type pour le formulaire UI ───────────────────────────────
export interface ExpenseFormData {
  id?: number;
  description: string;
  amount: number;
  category: string;
  type: 'expense' | 'income';
  isRecurring: boolean;      // ✅ AJOUTÉ
  date?: string;
}