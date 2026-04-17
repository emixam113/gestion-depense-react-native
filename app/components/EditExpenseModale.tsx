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
import { useTheme } from '../../Context/ThemeContext';
import { useAccessibility } from '../../Context/Accessibility';
import { getWithAuth, sendWithAuth } from '../../services/Api';
import { Pencil, X, Check, ArrowUpCircle, ArrowDownCircle, Tag } from 'lucide-react-native';
import type { Expense, Category } from "../../Types";

interface EditExpenseModalProps {
    visible: boolean;
    expense: Expense | null;
    onClose: () => void;
    onSave: (updated: Expense) => void;
}

export default function EditExpenseModal({
    visible,
    expense,
    onClose,
    onSave,
}: EditExpenseModalProps) {
    const { colors } = useTheme();
    const { fontFamily, accessibleFont } = useAccessibility();

    const [form, setForm] = useState({
        label: "",
        amount: "",
        type: "expense" as "expense" | "income",
        categoryId: null as number | null
    });

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && expense) {
            setForm({
                label: expense.label,
                // On affiche la valeur absolue pour l'édition[cite: 4]
                amount: Math.abs(Number(expense.amount)).toString(),
                type: expense.type,
                categoryId: expense.category?.id || null
            });
            loadCategories();
        }
    }, [visible, expense]);

    // Récupération automatique des catégories avec authentification[cite: 3]
    const loadCategories = async () => {
        try {
            const data = await getWithAuth<Category[]>('/categories');
            setCategories(data);
        } catch (err: any) {
            console.error("Erreur catégories:", err.message);
        }
    };

    const handleSubmit = async () => {
        if (!expense) return;
        if (!form.label.trim() || !form.amount || !form.categoryId) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs");
            return;
        }

        setLoading(true);
        try {
            // Logique automatisée : Dépense = Négatif, Revenu = Positif
            const rawAmount = Math.abs(Number(form.amount.replace(',', '.')));
            const signedAmount = form.type === 'expense' ? -rawAmount : rawAmount;

            const payload = {
                label: form.label,
                amount: signedAmount,
                type: form.type,
                categoryId: form.categoryId,
                date: expense.date // Conservation de la date originale
            };

            // Envoi automatisé vers l'API avec le token stocké[cite: 3]
            const updated = await sendWithAuth<Expense>(
                `/expenses/${expense.id}`,
                'PATCH',
                payload
            );

            onSave(updated); // Mise à jour de la liste parente
            onClose();
        } catch (err: any) {
            Alert.alert("Erreur", err.message || "Impossible de modifier la dépense");
        } finally {
            setLoading(false);
        }
    };

    const getTextStyle = (type: keyof typeof fontFamily, size: number) => ({
        fontFamily: fontFamily[type],
        fontSize: size,
        lineHeight: accessibleFont ? size * 1.4 : size * 1.2,
    });

    if (!expense) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
                    <View style={styles.modalHeader}>
                        <View style={[styles.titleIcon, { backgroundColor: colors.primary + '15' }]}>
                            <Pencil size={20} color={colors.primary} />
                        </View>
                        <Text style={[getTextStyle('bold', 20), { color: colors.text, flex: 1, marginLeft: 12 }]}>
                            Modifier la transaction
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <View style={styles.typeRow}>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    form.type === "income" ? styles.activeIncome : { backgroundColor: colors.inputBackground }
                                ]}
                                onPress={() => setForm({ ...form, type: "income" })}
                            >
                                <ArrowUpCircle size={20} color={form.type === "income" ? "#FFF" : "#2CC26D"} />
                                <Text style={[getTextStyle('bold', 14), { color: form.type === "income" ? "#FFF" : colors.text, marginLeft: 8 }]}>
                                    Revenu
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    form.type === "expense" ? styles.activeExpense : { backgroundColor: colors.inputBackground }
                                ]}
                                onPress={() => setForm({ ...form, type: "expense" })}
                            >
                                <ArrowDownCircle size={20} color={form.type === "expense" ? "#FFF" : "#FF6B6B"} />
                                <Text style={[getTextStyle('bold', 14), { color: form.type === "expense" ? "#FFF" : colors.text, marginLeft: 8 }]}>
                                    Dépense
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[getTextStyle('semiBold', 14), { color: colors.textSecondary, marginBottom: 8 }]}>Libellé</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, fontFamily: fontFamily.regular }]}
                                value={form.label}
                                onChangeText={(text) => setForm({ ...form, label: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[getTextStyle('semiBold', 14), { color: colors.textSecondary, marginBottom: 8 }]}>Montant (€)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border, fontFamily: fontFamily.bold }]}
                                keyboardType="numeric"
                                value={form.amount}
                                onChangeText={(text) => setForm({ ...form, amount: text.replace(/[^0-9,.]/g, "") })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                <Tag size={16} color={colors.primary} />
                                <Text style={[getTextStyle('semiBold', 14), { color: colors.textSecondary, marginLeft: 6 }]}>Catégorie</Text>
                            </View>
                            <View style={styles.categoryGrid}>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryChip,
                                            {
                                                borderColor: form.categoryId === cat.id ? colors.primary : 'transparent',
                                                backgroundColor: form.categoryId === cat.id ? colors.primary + '15' : colors.inputBackground
                                            }
                                        ]}
                                        onPress={() => setForm({ ...form, categoryId: cat.id })}
                                    >
                                        <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                                        <Text style={[getTextStyle('regular', 13), { color: colors.text }]}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onClose}>
                                <Text style={[getTextStyle('bold', 15), { color: colors.textSecondary }]}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btn, styles.btnSave, { backgroundColor: colors.primary }]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#FFF" /> : (
                                    <>
                                        <Check size={20} color="#FFF" style={{ marginRight: 8 }} />
                                        <Text style={[getTextStyle('bold', 15), { color: "#FFF" }]}>Confirmer</Text>
                                    </>
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
    overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
    modalContainer: { width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    titleIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    closeButton: { padding: 4 },
    scrollContent: { paddingBottom: 20 },
    inputGroup: { marginBottom: 20 },
    input: { padding: 14, borderRadius: 12, fontSize: 16, borderWidth: 1.5 },
    typeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    typeButton: { flex: 1, flexDirection: 'row', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    activeIncome: { backgroundColor: '#2CC26D' },
    activeExpense: { backgroundColor: '#FF6B6B' },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 2, gap: 8 },
    colorDot: { width: 10, height: 10, borderRadius: 5 },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
    btn: { flex: 1, padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    btnCancel: { backgroundColor: 'transparent' },
    btnSave: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }
});