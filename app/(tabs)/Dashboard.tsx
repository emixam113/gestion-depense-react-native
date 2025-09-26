import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AddExpense from "../components/AddExpense";
import ExpenseList from "../components/ExpenseList";
import Graph from "../components/Graph";

type Expense = {
    description: string;
    amount: number;
    category: string;
    type: "income" | "expense";
};

type User = {
    firstname: string;
    lastname: string;
};

export default function Dashboard() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const storedUser = await AsyncStorage.getItem("user");
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (err) {
                console.error("Erreur lors de la récupération du user", err);
            }
        };
        fetchUser();
    }, []);

    // ➕ Ajout transaction
    const handleAddExpense = (expense: Expense) => {
        setExpenses((prev) => [...prev, expense]);
    };

    // 💰 Calcul du solde
    const total = expenses.reduce((acc, item) => {
        return item.type === "income" ? acc + item.amount : acc - item.amount;
    }, 0);

    // 📊 Données pour Graph
    const revenus = expenses
        .filter((e) => e.type === "income")
        .reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {} as Record<string, number>);

    const depenses = expenses
        .filter((e) => e.type === "expense")
        .reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {} as Record<string, number>);

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* 👋 Bienvenue */}
            <Text style={styles.title}>
                Bienvenue {user ? `${user.firstname} ${user.lastname}` : "👋"}
            </Text>

            {/* 💰 Solde */}
            <View style={styles.balanceBox}>
                <Text style={styles.balanceTitle}>Solde actuel</Text>
                <Text style={[styles.balanceAmount, { color: total >= 0 ? "green" : "red" }]}>
                    {total.toFixed(2)} €
                </Text>
            </View>

            {/* 📊 Graphique */}
            <Graph revenus={revenus} depenses={depenses} />

            {/* ➕ Ajouter transaction */}
            <AddExpense
                onAdd={handleAddExpense}
                categories={["Courses", "Loisirs", "Transport", "Autres"]}
            />

            {/* 📋 Liste */}
            <ExpenseList expenses={expenses} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#EAF7EF",
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
    },
    balanceBox: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: "center",
        elevation: 2,
    },
    balanceTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    balanceAmount: {
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 5,
    },
});
