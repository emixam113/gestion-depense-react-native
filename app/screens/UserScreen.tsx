import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  User,
  Mail,
  Calendar,
  Crown,
  Pencil,
  Check,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../Context/ThemeContext';
import { useAccessibility } from '../../Context/Accessibility';
import { getWithAuth, sendWithAuth } from '../../services/Api';
import { sendLocalNotification } from '../../services/NotificationService';
import { SubscriptionContext } from '../../Context/SubscriptionsProvider';

// ─── Types ────────────────────────────────────────────────────
interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
}

export default function UserScreen() {
  const { colors } = useTheme();
  const { fontFamily } = useAccessibility();
  const router = useRouter();

  // CORRECTION : Utilisation de SubscriptionContext (sans le 's')
  const { isPremium, loading: subscriptionLoading } = useContext(SubscriptionContext);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Chargement du profil ──────────────────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getWithAuth<UserProfile>('/users/me');
        setProfile(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setEmail(data.email);
      } catch (e) {
        console.error('[UserScreen] Erreur chargement profil:', e);
        const stored = await AsyncStorage.getItem('user');
        if (stored) {
          const user = JSON.parse(stored);
          setFirstName(user.firstName || '');
          setLastName(user.lastName || '');
          setEmail(user.email || '');
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleCancel = () => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setEmail(profile.email);
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await sendWithAuth<UserProfile>('/users/me', 'PATCH', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });

      setProfile(updated);

      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        await AsyncStorage.setItem(
          'user',
          JSON.stringify({
            ...user,
            firstName: updated.firstName,
            lastName: updated.lastName,
            email: updated.email,
          }),
        );
      }

      setIsEditing(false);

      await sendLocalNotification({
        title: 'Profil mis à jour ✅',
        body: `Vos modifications ont bien été enregistrées, ${updated.firstName} !`,
        channelId: 'default',
        data: { type: 'profile_updated' },
      });
    } catch (e) {
      console.error('[UserScreen] Erreur sauvegarde:', e);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <X size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fontFamily.bold }]}>Mon Profil</Text>
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editHeaderButton}>
            <Pencil size={20} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '25' }]}>
            <Text style={[styles.avatarText, { color: colors.primary, fontFamily: fontFamily.bold }]}>
              {firstName.charAt(0).toUpperCase()}{lastName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.fullName, { color: colors.text, fontFamily: fontFamily.bold }]}>
            {firstName} {lastName}
          </Text>
        </View>

        {/* Statut abonnement */}
        <TouchableOpacity
          style={[
            styles.subscriptionCard,
            { backgroundColor: isPremium ? colors.primary + '15' : colors.cardBackground },
            { borderColor: isPremium ? colors.primary : colors.border },
          ]}
          onPress={() => !isPremium && router.push('/screens/OfferScreen')}
          disabled={subscriptionLoading}
        >
          <View style={styles.subscriptionLeft}>
            <Crown
              size={22}
              color={isPremium ? colors.primary : colors.textSecondary}
              fill={isPremium ? colors.primary : 'none'}
            />
            <View style={styles.subscriptionText}>
              <Text style={[
                styles.subscriptionTitle,
                { fontFamily: fontFamily.bold, color: isPremium ? colors.primary : colors.text },
              ]}>
                {isPremium ? 'Abonnement Premium actif' : 'Passer à Premium'}
              </Text>
              <Text style={[styles.subscriptionSub, { fontFamily: fontFamily.regular, color: colors.textSecondary }]}>
                {isPremium
                  ? 'Toutes les fonctionnalités sont débloquées'
                  : 'Débloquez le graphique et plus — 4,99€/mois'}
              </Text>
            </View>
          </View>
          {!isPremium && <ChevronRight size={18} color={colors.textSecondary} />}
          {isPremium && (
            <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.activeBadgeText, { fontFamily: fontFamily.bold }]}>Actif</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Informations personnelles */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontFamily: fontFamily.bold }]}>
            INFORMATIONS PERSONNELLES
          </Text>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <User size={14} color={colors.textSecondary} />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>Prénom</Text>
            </View>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: isEditing ? colors.primary : colors.border, backgroundColor: isEditing ? colors.inputBackground : colors.cardBackground, fontFamily: fontFamily.regular }]}
              value={firstName}
              onChangeText={setFirstName}
              editable={isEditing}
            />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <User size={14} color={colors.textSecondary} />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>Nom</Text>
            </View>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: isEditing ? colors.primary : colors.border, backgroundColor: isEditing ? colors.inputBackground : colors.cardBackground, fontFamily: fontFamily.regular }]}
              value={lastName}
              onChangeText={setLastName}
              editable={isEditing}
            />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Mail size={14} color={colors.textSecondary} />
              <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>Email</Text>
            </View>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: isEditing ? colors.primary : colors.border, backgroundColor: isEditing ? colors.inputBackground : colors.cardBackground, fontFamily: fontFamily.regular }]}
              value={email}
              onChangeText={setEmail}
              editable={isEditing}
            />
          </View>
        </View>

        {isEditing && (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.buttonHalf, { backgroundColor: colors.border }]} onPress={handleCancel}>
              <Text style={[styles.buttonText, { color: colors.text, fontFamily: fontFamily.bold }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.buttonHalf, { backgroundColor: colors.primary }]} onPress={handleSave}>
              <Text style={[styles.buttonText, { color: '#FFF', fontFamily: fontFamily.bold }]}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  editHeaderButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, color: '#FFF' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 20, marginTop: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28 },
  fullName: { fontSize: 20, marginBottom: 4 },
  subscriptionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1.5, marginBottom: 16 },
  subscriptionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  subscriptionText: { flex: 1 },
  subscriptionTitle: { fontSize: 15, marginBottom: 2 },
  subscriptionSub: { fontSize: 12 },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  activeBadgeText: { color: '#FFF', fontSize: 12 },
  card: { borderRadius: 16, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 11, letterSpacing: 1, marginBottom: 16 },
  fieldGroup: { marginBottom: 16 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldLabel: { fontSize: 13 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  buttonHalf: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15 },
});