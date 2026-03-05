import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Alert,
    ActivityIndicator
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from '../Context/ThemeContext';
import { useAccessibility } from '../Context/Accessibility';
import type { Expense, Category } from "../Types";

interface EditExpenseModalProps {
    visible: boolean;
    expense: Expense | null;
    onClose: () => void;
    onSave: (updated: Expense) => void;
    token: string | null;
}

const BASE_API_URL = "http://192.168.1.39:3000";

export default function EditExpenseModal({
    visible,
    expense,
    onClose,
    onSave,
    token
}: EditExpenseModalProps) {
    const { colors } = useTheme();
    const { fontFamily } = useAccessibility();

    const [form, setForm] = useState({
        label: "",
        amount: "",
        date: "",
        type: "expense" as "expense" | "income",
        categoryId: null as number | null
    });

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);

    // Charger les données quand le modal s'ouvre
    useEffect(() => {
        if (visible && expense) {
            setForm({
                label: expense.label,
                amount: expense.amount.toString(),
                date: expense.date,
                type: expense.type,
                categoryId: expense.category?.id || null
            });
            fetchCategories();
        }
    }, [visible, expense]);

    const fetchCategories = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${BASE_API_URL}/categories`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Erreur lors du chargement des catégories");
            const data: Category[] = await res.json();
            setCategories(data);
        } catch (err) {
            console.error("Erreur fetch catégories:", err);
            Alert.alert("Erreur", "Impossible de charger les catégories");
        }
    };

    const handleSubmit = async () => {
        if (!token || !expense) return;

        if (!form.label.trim() || !form.amount || !form.categoryId) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                label: form.label,
                amount: Number(form.amount),
                date: new Date(form.date).toISOString(),
                type: form.type,
                categoryId: form.categoryId,
            };

            const res = await fetch(`${BASE_API_URL}/expenses/${expense.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error("Erreur lors de la modification");
            }

            const updated: Expense = await res.json();
            onSave(updated);
            Alert.alert("Succès", "Dépense modifiée avec succès");
            onClose();
        } catch (err) {
            console.error("Erreur modification:", err);
            Alert.alert("Erreur", "Impossible de modifier la dépense");
        } finally {
            setLoading(false);
        }
    };

    if (!expense) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={[styles.title, { fontFamily: fontFamily.bold, color: colors.text }]}>
                            ✏️ Modifier la transaction
                        </Text>

                        {/* Libellé */}
                        <Text style={[styles.label, { fontFamily: fontFamily.semiBold, color: colors.text }]}>
                            Libellé
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    fontFamily: fontFamily.regular,
                                    backgroundColor: colors.inputBackground,
                                    color: colors.text,
                                    borderColor: colors.border
                                }
                            ]}
                            placeholder="Libellé"
                            placeholderTextColor={colors.textSecondary}
                            value={form.label}
                            onChangeText={(text) => setForm({ ...form, label: text })}
                        />

                        {/* Montant */}
                        <Text style={[styles.label, { fontFamily: fontFamily.semiBold, color: colors.text }]}>
                            Montant
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    fontFamily: fontFamily.regular,
                                    backgroundColor: colors.inputBackground,
                                    color: colors.text,
                                    borderColor: colors.border
                                }
                            ]}
                            placeholder="Montant"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="numeric"
                            value={form.amount}
                            onChangeText={(text) => setForm({ ...form, amount: text.replace(/[^0-9,.]/g, "") })}
                        />

                        {/* Type */}
                        <Text style={[styles.label, { fontFamily: fontFamily.semiBold, color: colors.text }]}>
                            Type
                        </Text>
                        <View style={styles.typeRow}>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    form.type === "income" ? styles.activeIncome : {
                                        backgroundColor: colors.inputBackground,
                                        borderColor: colors.border
                                    }
                                ]}
                                onPress={() => setForm({ ...form, type: "income" })}
                            >
                                <Text style={[
                                    styles.typeText,
                                    { fontFamily: fontFamily.bold },
                                    form.type === "income" ? { color: '#FFF' } : { color: colors.textSecondary }
                                ]}>
                                    Revenu
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    form.type === "expense" ? styles.activeExpense : {
                                        backgroundColor: colors.inputBackground,
                                        borderColor: colors.border
                                    }
                                ]}
                                onPress={() => setForm({ ...form, type: "expense" })}
                            >
                                <Text style={[
                                    styles.typeText,
                                    { fontFamily: fontFamily.bold },
                                    form.type === "expense" ? { color: '#FFF' } : { color: colors.textSecondary }
                                ]}>
                                    Dépense
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Catégorie */}
                        <Text style={[styles.label, { fontFamily: fontFamily.semiBold, color: colors.text }]}>
                            Catégorie
                        </Text>
                        <View style={[styles.pickerContainer, {
                            borderColor: colors.border,
                            backgroundColor: colors.surface
                        }]}>
                            <Picker
                                selectedValue={form.categoryId}
                                onValueChange={(value) => setForm({ ...form, categoryId: value })}
                                style={{ color: colors.text }}
                                dropdownIconColor={colors.text}
                            >
                                <Picker.Item label="-- Choisir une catégorie --" value={null} />
                                {categories.map((cat) => (
                                    <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                                ))}
                            </Picker>
                        </View>

                        {/* Pastilles de catégories */}
                        <View style={styles.categoryGrid}>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.categoryChip,
                                        {
                                            borderColor: form.categoryId === cat.id ? colors.primary : colors.border,
                                            backgroundColor: form.categoryId === cat.id ? colors.primary + '20' : colors.inputBackground
                                        }
                                    ]}
                                    onPress={() => setForm({ ...form, categoryId: cat.id })}
                                >
                                    <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                                    <Text style={[
                                        styles.categoryChipText,
                                        { fontFamily: fontFamily.regular, color: colors.text }
                                    ]}>
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Boutons */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton, { backgroundColor: colors.border }]}
                                onPress={onClose}
                                disabled={loading}
                            >
                                <Text style={[styles.buttonText, { fontFamily: fontFamily.bold, color: colors.textSecondary }]}>
                                    Annuler
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.saveButton, { backgroundColor: colors.success }]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={[styles.buttonText, { fontFamily: fontFamily.bold }]}>
                                        Sauvegarder
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 450,
        borderRadius: 16,
        padding: 20,
        maxHeight: '90%',
    },
    title: {
        fontSize: 22,
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        marginBottom: 6,
        marginTop: 8,
    },
    input: {
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        fontSize: 15,
        borderWidth: 1,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    typeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
    },
    activeIncome: {
        backgroundColor: '#2CC26D',
        borderColor: '#2CC26D',
    },
    activeExpense: {
        backgroundColor: '#FF6B6B',
        borderColor: '#FF6B6B',
    },
    typeText: {
        fontSize: 14,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 12,
        overflow: 'hidden',
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 2,
        gap: 6,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    categoryChipText: {
        fontSize: 13,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    button: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        // backgroundColor géré dynamiquement
    },
    saveButton: {
        // backgroundColor géré dynamiquement
    },
    buttonText: {
        fontSize: 15,
        color: '#FFF',
    },
});