import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";

type Expense = {
    description: string;
    amount: number;
    category: string;
    type: "income" | "expense";
};

type ExpenseListProps = {
    expenses: Expense[];
};

export default function ExpenseList({ expenses }: ExpenseListProps) {
    if (!expenses || expenses.length === 0) {
        return (
            <Text style={styles.emptyText}>Aucune transaction pour le moment</Text>
        );
    }

    return (
        <FlatList
            data={expenses}
            keyExtractor={(_, index) => index.toString()} // ✅ évite l'erreur si pas d'id
            renderItem={({ item }) => (
                <View style={styles.item}>
                    <Text style={styles.text}>
                        {item.type === "income" ? "💰" : "💸"} {item.description} -{" "}
                        {item.amount}€
                    </Text>
                    <Text style={styles.category}>{item.category}</Text>
                </View>
            )}
        />
    );
}

const styles = StyleSheet.create({
    item: {
        backgroundColor: "#fff",
        padding: 12,
        marginVertical: 6,
        borderRadius: 8,
        elevation: 2,
    },
    text: {
        fontSize: 16,
    },
    category: {
        fontSize: 14,
        color: "gray",
    },
    emptyText: {
        fontSize: 16,
        textAlign: "center",
        marginTop: 20,
        color: "gray",
    },
});