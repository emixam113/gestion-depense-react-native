import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";

const eyeVisible = require("../../assets/images/Vector.png");
const eyeHidden = require("../../assets/images/Eye-Pass.png");

const API_URL = "http://192.168.1.37:3000";

type Step = 'email' | 'reset';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);

  // Étape 1
  const [email, setEmail] = useState("");

  // Étape 2
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // ════════════════════════════════════════════════════════
  // ÉTAPE 1 — Envoyer l'email
  // ════════════════════════════════════════════════════════
  const handleSendEmail = async () => {
    if (!email) {
      Alert.alert("Erreur", "Veuillez entrer votre adresse e-mail.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erreur", "Veuillez entrer une adresse e-mail valide.");
      return;
    }

    setIsLoading(true);
    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      setStep("reset");
      Alert.alert(
        "E-mail envoyé ✅",
        "Si un compte existe avec cet e-mail, vous recevrez un code de réinitialisation."
      );
    } catch (err) {
      Alert.alert("Erreur", "Impossible de contacter le serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════
  // ÉTAPE 2 — Réinitialiser le mot de passe
  // ✅ CORRIGÉ — envoie { email, code, newPassword }
  // ════════════════════════════════════════════════════════
  const handleResetPassword = async () => {
    if (!code || !newPassword || !confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,       // ✅ email conservé depuis l'étape 1
          code,        // ✅ "code" au lieu de "token"
          newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Code invalide ou expiré.");
      }

      Alert.alert(
        "Succès ✅",
        "Votre mot de passe a été réinitialisé avec succès.",
        [{ text: "Se connecter", onPress: () => router.replace("/screens/LoginScreen") }]
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue.";
      Alert.alert("Erreur", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════
  // RENDU — Étape 1
  // ════════════════════════════════════════════════════════
  const renderEmailStep = () => (
    <>
      <Text style={styles.subtitle}>
        Entrez votre adresse e-mail et nous vous enverrons un code pour réinitialiser votre mot de passe.
      </Text>
      <View style={styles.formContainer}>
        <Text style={styles.label}>Adresse e-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="exemple@exemple.com"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TouchableOpacity style={styles.mainButton} onPress={handleSendEmail} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Envoyer le code</Text>}
        </TouchableOpacity>
      </View>
      <View style={styles.bottomTextContainer}>
        <Text style={styles.bottomText}>Vous vous en souvenez ?</Text>
        <TouchableOpacity onPress={() => router.replace("/screens/LoginScreen")}>
          <Text style={styles.bottomLink}> Se connecter</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ════════════════════════════════════════════════════════
  // RENDU — Étape 2
  // ════════════════════════════════════════════════════════
  const renderResetStep = () => (
    <>
      <Text style={styles.subtitle}>
        Entrez le code reçu par e-mail et choisissez un nouveau mot de passe.
      </Text>
      <View style={styles.formContainer}>
        <Text style={styles.label}>Code de réinitialisation</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 123456"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={code}
          onChangeText={setCode}
        />

        <Text style={styles.label}>Nouveau mot de passe</Text>
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Au moins 6 caractères"
            placeholderTextColor="#888"
            secureTextEntry={!isPasswordVisible}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <Image source={isPasswordVisible ? eyeVisible : eyeHidden} style={styles.eyeIcon} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirmer le mot de passe</Text>
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirmation"
            placeholderTextColor="#888"
            secureTextEntry={true}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <TouchableOpacity style={styles.mainButton} onPress={handleResetPassword} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Réinitialiser</Text>}
        </TouchableOpacity>
      </View>
      <View style={styles.bottomTextContainer}>
        <Text style={styles.bottomText}>Pas reçu le code ?</Text>
        <TouchableOpacity onPress={() => setStep("email")}>
          <Text style={styles.bottomLink}> Renvoyer</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ════════════════════════════════════════════════════════
  // RENDU PRINCIPAL
  // ════════════════════════════════════════════════════════
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={styles.outerContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {step === "email" ? "Mot de passe oublié" : "Nouveau mot de passe"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Indicateur d'étape */}
      <View style={styles.stepsRow}>
        <View style={[styles.stepDot, { backgroundColor: "#28A745" }]} />
        <View style={[styles.stepLine, { backgroundColor: step === "reset" ? "#28A745" : "#ccc" }]} />
        <View style={[styles.stepDot, { backgroundColor: step === "reset" ? "#28A745" : "#ccc" }]} />
      </View>
      <View style={styles.stepsLabels}>
        <Text style={[styles.stepLabel, { color: "#28A745" }]}>Email</Text>
        <Text style={[styles.stepLabel, { color: step === "reset" ? "#28A745" : "#aaa" }]}>Réinitialisation</Text>
      </View>

      {step === "email" ? renderEmailStep() : renderResetStep()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: "#EAF7EF" },
  scrollContainer: { alignItems: "center", paddingVertical: 20, paddingHorizontal: 15 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 20 },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  backIcon: { fontSize: 36, color: "#28A745", fontWeight: "bold" },
  title: { fontSize: 22, fontWeight: "bold", color: "#333", textAlign: "center" },
  stepsRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  stepDot: { width: 14, height: 14, borderRadius: 7 },
  stepLine: { width: 80, height: 3, marginHorizontal: 6 },
  stepsLabels: { flexDirection: "row", justifyContent: "space-between", width: 130, marginBottom: 24 },
  stepLabel: { fontSize: 12, fontWeight: "600" },
  subtitle: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 20, paddingHorizontal: 10, lineHeight: 20 },
  formContainer: { backgroundColor: "#A8E3B6", width: "100%", maxWidth: 400, padding: 20, borderRadius: 20, alignItems: "flex-start", marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 5, marginTop: 10 },
  input: { width: "100%", height: 45, backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 15, marginBottom: 5 },
  passwordInputContainer: { flexDirection: "row", alignItems: "center", width: "100%", backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 15, marginBottom: 5 },
  passwordInput: { flex: 1, height: 45 },
  eyeIcon: { width: 20, height: 20, marginLeft: 10 },
  mainButton: { width: "60%", alignSelf: "center", backgroundColor: "#8BC34A", padding: 12, borderRadius: 50, alignItems: "center", marginTop: 30 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  bottomTextContainer: { flexDirection: "row", marginTop: 10 },
  bottomText: { color: "#333" },
  bottomLink: { color: "#28A745", fontWeight: "bold" },
});