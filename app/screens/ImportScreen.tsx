import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
// Remplacement par les icônes Lucide pour un look plus moderne
import { FileSpreadsheet, FileUp } from 'lucide-react-native';

export default function ImportCsvScreen({ userToken }: { userToken: string }) {
  const [isUploading, setIsUploading] = useState(false);

  const pickAndUploadCsv = async () => {
    try {
      // 1. Sélection du fichier
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/comma-separated-values',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setIsUploading(true);

      // 2. Préparation du FormData
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: 'text/csv',
      } as any);

      // 3. Envoi au backend (IP 10.0.2.2 pour l'émulateur Android)
      const response = await fetch('http://10.0.2.2:3000/export/import', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Succès",
          `Importation réussie : ${data.count} transactions ajoutées !`,
          [{ text: "OK" }]
        );
      } else {
        throw new Error(data.message || "Erreur lors de l'importation");
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Icône principale : Un document type tableur/CSV */}
      <FileSpreadsheet size={80} color="#38bdf8" strokeWidth={1.5} />

      <Text style={styles.title}>Importer vos relevés</Text>
      <Text style={styles.subtitle}>
        Sélectionnez votre fichier CSV pour synchroniser vos dépenses automatiquement.
      </Text>

      <TouchableOpacity
        style={[styles.button, isUploading && styles.buttonDisabled]}
        onPress={pickAndUploadCsv}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            {/* Icône du bouton : Fichier avec une flèche vers le haut */}
            <FileUp size={22} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.buttonText}>Choisir un fichier .csv</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginTop: 24 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 10, marginBottom: 36, lineHeight: 20 },
  button: {
    backgroundColor: '#38bdf8',
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3
  },
  buttonDisabled: { backgroundColor: '#94a3b8' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});