import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Tag, CircleDollarSign, Repeat, PlusCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react-native';

import { useAccessibility } from '../Context/Accessibility';
import { useTheme } from '../Context/ThemeContext';

interface AddExpenseProps {
    onAdd: (expense: any) => Promise<void>; // Changé en Promise pour le chargement instantané
    categories: any[];
}

export default function AddExpense({ onAdd, categories = [] }: AddExpenseProps) {
    const { fontFamily } = useAccessibility();
    const { colors } = useTheme();

    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [type, setType] = useState<"income" | "expense">("expense");
    const [isRecurring, setIsRecurring] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialisation de la catégorie par défaut
    useEffect(() => {
        if (categories?.length > 0 && !category) {
            const firstCat = categories[0];
            setCategory(firstCat.name || firstCat.label || "");
        }
    }, [categories]);

    const handleSubmit = async () => {
        const numericAmount = parseFloat(amount.replace(',', '.'));

        if (!description || isNaN(numericAmount) || isSubmitting) return;

        setIsSubmitting(true);

        // Préparation de l'objet pour le backend (PostgreSQL)
        const newExpense = {
            label: description.trim(),
            amount: type === "expense" ? -Math.abs(numericAmount) : Math.abs(numericAmount),
            type: type,
            date: new Date().toISOString(),
            // On récupère l'ID de la catégorie
            categoryId: categories.find(c => (c.name || c.label) === category)?.id || categories[0]?.id,
            isRecurring: type === "expense" ? isRecurring : false,
        };

        try {
            // ✅ On attend que le Dashboard ait fini l'appel API
            await onAdd(newExpense);

            // ✅ Reset du formulaire seulement après succès
            setDescription("");
            setAmount("");
            setIsRecurring(false);
        } catch (error) {
            console.error("Erreur lors de l'ajout :", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.header}>
                <PlusCircle color={colors.primary} size={24} />
                <Text style={[styles.title, { color: colors.text, fontFamily: fontFamily.bold, marginLeft: 10 }]}>
                    Nouvelle Transaction
                </Text>
            </View>

            {/* Sélecteur de Type */}
            <View style={styles.row}>
                <TouchableOpacity
                    style={[styles.typeButton, type === "income" ? styles.activeIncome : { borderColor: colors.border }]}
                    onPress={() => setType("income")}
                >
                    <ArrowUpCircle size={20} color={type === "income" ? "#FFF" : colors.textSecondary} />
                    <Text style={[styles.typeText, { color: type === "income" ? "#FFF" : colors.textSecondary, fontFamily: fontFamily.bold }]}>Revenu</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.typeButton, type === "expense" ? styles.activeExpense : { borderColor: colors.border }]}
                    onPress={() => setType("expense")}
                >
                    <ArrowDownCircle size={20} color={type === "expense" ? "#FFF" : colors.textSecondary} />
                    <Text style={[styles.typeText, { color: type === "expense" ? "#FFF" : colors.textSecondary, fontFamily: fontFamily.bold }]}>Dépense</Text>
                </TouchableOpacity>
            </View>

            {/* Champ Description */}
            <View style={styles.inputWrapper}>
                <Tag size={20} color={colors.textSecondary} style={styles.icon} />
                <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, fontFamily: fontFamily.regular }]}
                    placeholder="Description (ex: Netflix, Loyer...)"
                    placeholderTextColor={colors.textSecondary}
                    value={description}
                    onChangeText={setDescription}
                />
            </View>

            {/* Champ Montant */}
            <View style={styles.inputWrapper}>
                <CircleDollarSign size={20} color={colors.textSecondary} style={styles.icon} />
                <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, fontFamily: fontFamily.regular }]}
                    placeholder="Montant (€)"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                />
            </View>

            {/* Sélecteur de Catégorie */}
            <View style={[styles.pickerWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Picker
                    selectedValue={category}
                    onValueChange={(itemValue) => setCategory(itemValue)}
                    style={{ color: colors.text }}
                    dropdownIconColor={colors.text}
                >
                    {categories.map((cat, index) => (
                        <Picker.Item
                            key={index}
                            label={cat.name || cat.label}
                            value={cat.name || cat.label}
                        />
                    ))}
                </Picker>
            </View>

            {/* Toggle Récurrent (Uniquement pour les dépenses) */}
            {type === "expense" && (
                <View style={styles.recurringRow}>
                    <View style={styles.recurringLabel}>
                        <Repeat size={20} color={colors.primary} />
                        <Text style={[styles.recurringText, { color: colors.text, fontFamily: fontFamily.regular }]}>
                            Dépense récurrente (Abonnement)
                        </Text>
                    </View>
                    <Switch
                        value={isRecurring}
                        onValueChange={setIsRecurring}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor="#FFF"
                    />
                </View>
            )}

            {/* Bouton Valider */}
            <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary, opacity: (!description || !amount || isSubmitting) ? 0.6 : 1 }]}
                onPress={handleSubmit}
                disabled={!description || !amount || isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={[styles.addButtonText, { fontFamily: fontFamily.bold }]}>
                        Enregistrer la transaction
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { padding: 20, borderRadius: 24, marginHorizontal: 16, marginVertical: 10, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'center' },
    title: { fontSize: 18 },
    inputWrapper: { position: 'relative', marginBottom: 15 },
    icon: { position: 'absolute', left: 15, top: 15, zIndex: 1 },
    input: { padding: 15, paddingLeft: 45, borderRadius: 15, fontSize: 16, borderWidth: 1 },
    pickerWrapper: { borderRadius: 15, borderWidth: 1, marginBottom: 15, overflow: 'hidden', justifyContent: 'center' },
    row: { flexDirection: "row", gap: 10, marginBottom: 15 },
    typeButton: { flex: 1, padding: 15, borderRadius: 15, alignItems: "center", flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1 },
    activeIncome: { backgroundColor: "#2CC26D", borderColor: "#2CC26D" },
    activeExpense: { backgroundColor: "#FF6B6B", borderColor: "#FF6B6B" },
    typeText: { fontSize: 14 },
    recurringRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 5 },
    recurringLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    recurringText: { fontSize: 14 },
    addButton: { padding: 16, borderRadius: 15, alignItems: 'center' },
    addButtonText: { color: '#FFFFFF', fontSize: 16 },
});