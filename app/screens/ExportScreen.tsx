import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  FileSpreadsheet,
  Info,
  CheckCircle2,
  Download,
} from 'lucide-react-native';

// Nouveaux imports recommandés pour SDK 54+
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { useTheme } from '../../Context/ThemeContext';
import { useAccessibility } from '../../Context/Accessibility';
import { getWithAuth } from '../../services/Api';
import type { Expense } from '../../Types';

// ─── Sanitisation CSV ──────────────────────────────────────────
const sanitizeCell = (value: string): string => {
  let sanitized = value.toString().trim();
  if (['=', '+', '-', '@'].includes(sanitized[0])) {
    sanitized = `'${sanitized}`;
  }
  return `"${sanitized.replace(/"/g, '""')}"`;
};

export default function ExportScreen() {
  const { colors, isDark } = useTheme();
  const { fontFamily } = useAccessibility();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const generateExcelCSV = async () => {
    setLoading(true);
    try {
      // 1. Récupération des données
      const expenses = await getWithAuth<Expense[]>('/expenses/me');

      if (!expenses || expenses.length === 0) {
        Alert.alert("Données vides", "Vous n'avez aucune transaction à exporter.");
        return;
      }

      // 2. Préparation du format Excel-Friendly
      const BOM = '\ufeff';
      const header = `${sanitizeCell('Date')};${sanitizeCell('Libellé')};${sanitizeCell('Montant')};${sanitizeCell('Type')};${sanitizeCell('Catégorie')}\n`;

      const rows = expenses
        .map((exp) => {
          const date = new Date(exp.date).toLocaleDateString('fr-FR');
          const amount = exp.amount.toString().replace('.', ',');
          const category = exp.category?.name || 'Sans catégorie';
          const type = exp.type === 'expense' ? 'Dépense' : 'Revenu';

          return [
            sanitizeCell(date),
            sanitizeCell(exp.label),
            sanitizeCell(amount),
            sanitizeCell(type),
            sanitizeCell(category),
          ].join(';');
        })
        .join('\n');

      const csvContent = BOM + header + rows;

      // 3. Création du fichier avec la nouvelle API (SDK 54)
      const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
      const fileName = `Export_Finances_${dateStr}.csv`;

      // On crée l'objet File directement dans le dossier cache
      const myFile = new File(Paths.cache, fileName);

      // On écrit le contenu
      await myFile.write(csvContent);

      // 4. Partage du fichier
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(myFile.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Ouvrir mon export',
        });
        setLastExport(new Date().toLocaleTimeString('fr-FR'));
      } else {
        Alert.alert('Erreur', "Le partage n'est pas disponible sur cet appareil.");
      }
    } catch (error) {
      console.error('[ExportScreen] Erreur:', error);
      Alert.alert('Erreur', "Impossible de générer l'export Excel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={32} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fontFamily.bold }]}>
          Exportation
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>

          <View style={[styles.iconCircle, { backgroundColor: '#1D743F15' }]}>
            <FileSpreadsheet size={48} color="#1D743F" />
          </View>

          <Text style={[styles.title, { color: colors.text, fontFamily: fontFamily.bold }]}>
            Format Excel (.csv)
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
            Générez un document contenant l'intégralité de vos transactions pour une analyse approfondie.
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <CheckCircle2 size={16} color="#34C759" />
              <Text style={[styles.featureText, { color: colors.text, fontFamily: fontFamily.regular }]}>
                Séparateurs ";" pour Excel FR
              </Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle2 size={16} color="#34C759" />
              <Text style={[styles.featureText, { color: colors.text, fontFamily: fontFamily.regular }]}>
                Gestion des accents (UTF-8)
              </Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle2 size={16} color="#34C759" />
              <Text style={[styles.featureText, { color: colors.text, fontFamily: fontFamily.regular }]}>
                Nombres formatés (virgules)
              </Text>
            </View>
            <View style={styles.featureItem}>
              <CheckCircle2 size={16} color="#34C759" />
              <Text style={[styles.featureText, { color: colors.text, fontFamily: fontFamily.regular }]}>
                Compatible SDK 54 (New File API)
              </Text>
            </View>
          </View>

          <View style={[styles.infoBox, { backgroundColor: isDark ? '#1A1A1A' : '#F0F9F4' }]}>
            <Info size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text, fontFamily: fontFamily.regular }]}>
              Une fois généré, vous pourrez l'envoyer par email ou l'enregistrer sur votre Drive.
            </Text>
          </View>
        </View>

        {lastExport && (
          <View style={styles.lastExportBadge}>
            <Text style={[styles.lastExportText, { color: '#34C759', fontFamily: fontFamily.semiBold }]}>
              ✓ Dernier export réussi à {lastExport}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.mainButton, { backgroundColor: '#1D743F' }]}
          onPress={generateExcelCSV}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Download size={24} color="#FFF" style={{ marginRight: 12 }} />
              <Text style={[styles.buttonText, { fontFamily: fontFamily.bold }]}>
                Télécharger pour Excel
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: colors.textSecondary, fontFamily: fontFamily.semiBold }]}>
            Plus tard
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, color: '#FFF' },
  scrollContent: { padding: 20, alignItems: 'center' },
  card: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 10,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, marginBottom: 10 },
  description: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  featuresList: { alignSelf: 'flex-start', marginBottom: 20, width: '100%' },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featureText: { fontSize: 14, marginLeft: 10 },
  infoBox: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  infoText: { fontSize: 13, marginLeft: 12, flex: 1, lineHeight: 18 },
  lastExportBadge: { marginTop: 20 },
  lastExportText: { fontSize: 14 },
  mainButton: {
    flexDirection: 'row',
    width: '100%',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: { color: '#FFF', fontSize: 18 },
  cancelButton: { marginTop: 20, padding: 10 },
  cancelText: { fontSize: 16 },
});