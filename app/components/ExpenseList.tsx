import React, { useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Pencil, Trash2, CircleDollarSign, Receipt } from 'lucide-react-native';
import { deleteWithAuth } from '../../services/Api';
import { useTheme } from '../../Context/ThemeContext';
import { useAccessibility } from '../../Context/Accessibility';
import EditExpenseModal from './EditExpenseModale';

import type { Expense } from '../../Types';
import type { FontConfig } from '../../Context/Accessibility';

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) return "Aujourd'hui";
  if (date.getTime() === yesterday.getTime()) return 'Hier';
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
};

const ExpenseItem = memo(({
  item,
  onDeleteSuccess,
  onEdit,
  colors,
  fontFamily,
  accessibleFont
}: any) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    Alert.alert('Confirmation', `Supprimer "${item.label}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            await deleteWithAuth(`/expenses/${item.id}`);
            onDeleteSuccess(item.id);
          } catch (error) {
            Alert.alert('Erreur', 'Suppression impossible');
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  const isIncome = item.type === 'income';
  const displayAmount = Math.abs(parseFloat(item.amount) || 0);

  const textStyle = (type: keyof FontConfig, size: number) => ({
    fontFamily: fontFamily[type],
    fontSize: size,
    lineHeight: accessibleFont ? size * 1.4 : size * 1.2,
    letterSpacing: accessibleFont ? 0.5 : 0,
  });

  return (
    <View style={[styles.item, { backgroundColor: colors.cardBackground }]}>
      {/* SECTION GAUCHE : Icône + Libellés */}
      <View style={styles.leftContainer}>
        <View style={[styles.iconWrapper, { backgroundColor: isIncome ? '#2CC26D15' : '#FF6B6B15' }]}>
          {isIncome ?
            <CircleDollarSign size={20} color="#2CC26D" /> :
            <Receipt size={20} color="#FF6B6B" />
          }
        </View>

        <View style={styles.textContainer}>
          <Text
            numberOfLines={1}
            style={[textStyle('semiBold', 15), { color: colors.text }]}
          >
            {item.label}
          </Text>
          <View style={styles.metaRow}>
            <Text numberOfLines={1} style={[textStyle('regular', 12), { color: colors.textSecondary, flexShrink: 1 }]}>
              {item.category.name}
            </Text>
            <Text style={[styles.separator, { color: colors.textSecondary }]}>•</Text>
            <Text style={[textStyle('regular', 12), { color: colors.textSecondary }]}>
              {formatDate(item.date)}
            </Text>
          </View>
        </View>
      </View>

      {/* SECTION DROITE : Montant + Actions */}
      <View style={styles.rightContainer}>
        <Text style={[
          textStyle('bold', 14),
          isIncome ? styles.income : styles.expense,
          styles.amountText
        ]}>
          {isIncome ? '+' : '-'} {displayAmount.toFixed(2)}€
        </Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.smallButton, { backgroundColor: colors.primary + '15' }]}
            onPress={() => onEdit(item)}
          >
            <Pencil size={16} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallButton, { backgroundColor: colors.error + '15' }]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Trash2 size={16} color={colors.error} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

export default function ExpenseList({ expenses, onDeleteSuccess, onEditSuccess, token }: any) {
  const { colors } = useTheme();
  const { fontFamily, accessibleFont } = useAccessibility();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const renderItem = useCallback(
    ({ item }: { item: Expense }) => (
      <ExpenseItem
        item={item}
        onDeleteSuccess={onDeleteSuccess}
        onEdit={setEditingExpense}
        colors={colors}
        fontFamily={fontFamily}
        accessibleFont={accessibleFont}
      />
    ),
    [colors, fontFamily, accessibleFont, onDeleteSuccess],
  );

  return (
    <>
      <FlatList
        data={expenses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { fontFamily: fontFamily.regular, color: colors.textSecondary }]}>
            Aucune transaction
          </Text>
        }
        contentContainerStyle={styles.list}
        removeClippedSubviews={true}
        scrollEnabled={false}
      />

      <EditExpenseModal
        visible={editingExpense !== null}
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSave={(u) => { onEditSuccess?.(u); setEditingExpense(null); }}
        token={token}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginVertical: 6,
    borderRadius: 16,
    // Ombre plus discrète pour le look épuré
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Prend tout l'espace restant
    marginRight: 10,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  separator: {
    marginHorizontal: 4,
    fontSize: 10,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -30,
  },
  amountText: {
    textAlign: 'right',
    marginRight: 10,
    minWidth: 90,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  smallButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  income: { color: '#2CC26D' },
  expense: { color: '#FF6B6B' },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
    opacity: 0.5,
  }
});