import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, SectionList } from "react-native";
import { useTheme } from '../Context/ThemeContext';
import { useAccessibility } from '../Context/Accessibility';
import { deleteWithAuth } from "../services/Api";
import { Trash2, Lock, LayoutGrid } from "lucide-react-native";

// On définit l'interface pour être sûr des données
export interface Category {
  id: number;
  name: string;
  color: string;
  isDefault: boolean;
}

interface CategoryListProps {
  categories: Category[]; // Données reçues du Dashboard
  onDeleteSuccess: () => void;
}

export default function CategoryList({ categories, onDeleteSuccess }: CategoryListProps) {
  const { colors } = useTheme();
  const { fontFamily } = useAccessibility();

  // Séparation des données
  const systemCats = categories.filter(c => c.isDefault === true);
  const userCats = categories.filter(c => c.isDefault === false);

  const sections = [
    { title: "Catégories Système", data: systemCats, type: 'system' },
    { title: `Mes Catégories (${userCats.length} / 5)`, data: userCats, type: 'user' },
  ];

  const handleDelete = async (id: number, name: string) => {
    Alert.alert("Suppression", `Supprimer "${name}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteWithAuth(`/categories/${id}`);
            onDeleteSuccess(); // Rafraîchit le Dashboard
          } catch (e) {
            Alert.alert("Erreur", "Suppression impossible");
          }
        }
      }
    ]);
  };

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id.toString()}
      scrollEnabled={false} // Laisse le Dashboard gérer le scroll
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <View style={styles.headerRow}>
            {section.type === 'system' ? <Lock size={14} color={colors.textSecondary} /> : <LayoutGrid size={14} color={colors.primary} />}
            <Text style={[styles.headerText, { color: colors.textSecondary, fontFamily: fontFamily.bold }]}>
              {section.title}
            </Text>
          </View>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={[styles.item, { borderBottomColor: colors.border }]}>
          <View style={styles.left}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={[styles.name, { color: colors.text, fontFamily: fontFamily.regular }]}>{item.name}</Text>
          </View>
          {item.isDefault ? (
            <Lock size={14} color={colors.textSecondary} style={{ opacity: 0.5 }} />
          ) : (
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)}>
              <Trash2 size={18} color="#F43F5E" />
            </TouchableOpacity>
          )}
        </View>
      )}
      ListEmptyComponent={() => (
        <Text style={styles.empty}>Chargement des catégories...</Text>
      )}
    />
  );
}

const styles = StyleSheet.create({
  sectionHeader: { paddingHorizontal: 20, marginTop: 25, marginBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { fontSize: 12, textTransform: 'uppercase' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 25, borderBottomWidth: 0.5 },
  left: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 15 },
  name: { fontSize: 16 },
  empty: { textAlign: 'center', marginTop: 20, fontStyle: 'italic' }
});