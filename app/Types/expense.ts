export type Expense = {
    id: number;
    title: string;
    amount: number;
    date: string;
    type: "depense" | "revenu";
    categoryId: number;
}
