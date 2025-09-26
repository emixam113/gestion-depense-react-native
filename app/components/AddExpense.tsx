import React, {useState} from "react";
import {View, Text, TextInput, TouchableOpacity, StyleSheet} from "react-native";
import {Picker} from "@react-native-picker/picker";

type AddExpenseProps = {
    onAdd: (expense: {
        description: string;
        amount: number;
        category: string;
        type: "income" | "expense";
    }) => void;
    categories: string[];
};

export default function AddExpense({onAdd, categories}: AddExpenseProps) {
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState(categories[0] || "");
    const [type, setType] = useState<"income" | "expense">("expense");

    const handleSubmit = () => {
        if (!description.trim() || !amount || isNaN(Number(amount))) {
            return alert("Veuillez remplir tous les champs correctement");
        }

        onAdd({
            description,
            amount: Number(amount),
            category,
            type,
        });

        // reset du formulaire
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
                placeholder="Description (ex: Courses)"
                value={description}
                onChangeText={setDescription}
            />

            <TextInput
                style={styles.input}
                placeholder="Montant"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
            />

            <Text style={styles.label}>Catégorie :</Text>
            <Picker selectedValue={category} onValueChange={(itemValue) => setCategory(itemValue)}>
                {categories.map((cat, idx) => (
                    <Picker.Item key={idx} label={cat} value={cat}/>
                ))}
            </Picker>

            <View style={styles.row}>
                <TouchableOpacity
                    style={[styles.typeButton, type === "income" && styles.activeIncome]}
                    onPress={() => setType("income")}
                >
                    <Text style={styles.typeText}>Revenu</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.typeButton, type === "expense" && styles.activeExpense]}
                    onPress={() => setType("expense")}
                >
                    <Text style={styles.typeText}>Dépense</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
                <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginVertical: 10,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
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
        width: "40%",
        alignItems: "center",
    },
    activeIncome: {
        backgroundColor: "#2CC26D",
    },
    activeExpense: {
        backgroundColor: "#FF6B6B",
    },
    typeText: {
        color: "#fff",
        fontWeight: "bold",
    },
    addButton: {
        backgroundColor: "#2CC26D",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
});