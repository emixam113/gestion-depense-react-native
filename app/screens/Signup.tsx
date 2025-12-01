import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	ScrollView, // Utiliser ScrollView pour accommoder tous les champs
	Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { signup } from "../services/Api"; // ⬅️ Importe TA fonction signup
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SignupScreen() {
	const router = useRouter();
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [birthDate, setBirthDate] = useState(""); // Format YYYY-MM-DD
	const [isLoading, setIsLoading] = useState(false);
	const [isPasswordVisible, setIsPasswordVisible] = useState(false); // Réutiliser la visibilité du mot de passe

	const handleSignup = async () => {
		// 1. Validation de base
		if (!firstName || !lastName || !email || !password || !confirmPassword || !birthDate) {
			Alert.alert("Erreur", "Veuillez remplir tous les champs.");
			return;
		}
		if (password !== confirmPassword) {
			Alert.alert("Erreur", "Les mots de passe ne correspondent pas.");
			return;
		}

		setIsLoading(true);

		try {
			// 2. Appel à la fonction signup de l'API
			const authData = await signup(
				firstName,
				lastName,
				email,
				password,
				confirmPassword,
				birthDate
			);

			// 3. Sauvegarde de la session
			await AsyncStorage.setItem("user", JSON.stringify(authData.user));
			await AsyncStorage.setItem("token", authData.access_token);

			Alert.alert("Succès", "Inscription réussie ! Vous êtes connecté.");

			// 4. Redirection vers le Dashboard après l'inscription
			router.replace("/(tabs)");
		} catch (err) {
			console.error("Erreur inscription:", err);
			const errorMessage = err instanceof Error ? err.message : "Impossible de se connecter au serveur";
			Alert.alert("Erreur d'Inscription", errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	// Petite fonction utilitaire pour formater la date (similaire à ton input amount)
	const formatBirthDate = (text: string) => {
		// Permet seulement les chiffres
		const cleaned = text.replace(/[^0-9]/g, '');

		if (cleaned.length <= 4) return cleaned; // Année
		if (cleaned.length <= 6) return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}`; // Année-Mois
		return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`; // Année-Mois-Jour
	};


	return (
		// J'utilise ScrollView ici pour que le contenu ne soit pas coupé par le clavier
		<ScrollView contentContainerStyle={styles.scrollContainer} style={styles.outerContainer}>

			<Text style={styles.title}>Créer un Compte</Text>

			{/* -------------------- Formulaire -------------------- */}
			<View style={styles.formContainer}>

				<Text style={styles.label}>Prénom</Text>
				<TextInput style={styles.input} placeholder="John" value={firstName} onChangeText={setFirstName} />

				<Text style={styles.label}>Nom de famille</Text>
				<TextInput style={styles.input} placeholder="Doe" value={lastName} onChangeText={setLastName} />

				<Text style={styles.label}>E-mail</Text>
				<TextInput
					style={styles.input}
					placeholder="john.doe@exemple.com"
					keyboardType="email-address"
					autoCapitalize="none"
					value={email}
					onChangeText={setEmail}
				/>

				<Text style={styles.label}>Date de Naissance (AAAA-MM-JJ)</Text>
				<TextInput
					style={styles.input}
					placeholder="1990-01-01"
					keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
					maxLength={10}
					value={birthDate}
					onChangeText={(text) => setBirthDate(formatBirthDate(text))}
				/>

				<Text style={styles.label}>Mot de passe</Text>
				<View style={styles.passwordInputContainer}>
					<TextInput
						style={styles.passwordInput}
						placeholder="Au moins 6 caractères"
						secureTextEntry={!isPasswordVisible}
						value={password}
						onChangeText={setPassword}
					/>
					<TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
						{/* Placeholder pour les icônes. Assurez-vous d'importer vos assets ou d'utiliser une librairie d'icônes */}
						<Text>{isPasswordVisible ? '👁️' : '🔒'}</Text>
					</TouchableOpacity>
				</View>

				<Text style={styles.label}>Confirmer le Mot de passe</Text>
				<View style={styles.passwordInputContainer}>
					<TextInput
						style={styles.passwordInput}
						placeholder="Confirmation"
						secureTextEntry={true} // Laisser toujours masqué pour la confirmation
						value={confirmPassword}
						onChangeText={setConfirmPassword}
					/>
				</View>

				{/* -------------------- Bouton Inscription -------------------- */}
				<TouchableOpacity style={styles.signupButton} onPress={handleSignup} disabled={isLoading}>
					{isLoading ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={styles.buttonText}>S'Inscrire</Text>
					)}
				</TouchableOpacity>

			</View>

			{/* -------------------- Lien Connexion -------------------- */}
			<View style={styles.loginTextContainer}>
				<Text style={styles.loginText}>Déjà un compte ?</Text>
				<TouchableOpacity onPress={()=> router.replace("/screens/LoginScreen")}>
					<Text style={styles.loginLink}> Se Connecter</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}

// ----------------------------------------------------------------------
// Styles basés sur LoginScreen pour la cohérence
// ----------------------------------------------------------------------
const styles = StyleSheet.create({
	outerContainer: {
		flex: 1,
		backgroundColor: "#EAF7EF",
	},
	scrollContainer: {
		alignItems: "center",
		paddingVertical: 40,
		paddingHorizontal: 15,
	},
	title: {
		fontSize: 30,
		fontWeight: "bold",
		marginTop: 10,
		marginBottom: 30,
		color: "#333",
	},
	formContainer: {
		backgroundColor: "#A8E3B6",
		width: "100%",
		maxWidth: 400, // Ajout d'une max-width pour un look plus agréable sur les grands écrans
		padding: 20,
		borderRadius: 20,
		alignItems: "flex-start",
		marginBottom: 20,
	},
	label: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 5,
		marginTop: 10,
	},
	input: {
		width: "100%",
		height: 45,
		backgroundColor: "#fff",
		borderRadius: 10,
		paddingHorizontal: 15,
		marginBottom: 5,
	},
	passwordInputContainer: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
		backgroundColor: "#fff",
		borderRadius: 10,
		paddingHorizontal: 15,
		marginBottom: 5,
	},
	passwordInput: {
		flex: 1,
		height: 45,
	},
	signupButton: {
		width: "60%",
		alignSelf: "center",
		backgroundColor: "#8BC34A",
		padding: 12,
		borderRadius: 50,
		alignItems: "center",
		marginTop: 30,
	},
	buttonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
	},
	loginTextContainer: {
		flexDirection: "row",
		marginTop: 10,
	},
	loginText: {
		color: "#333",
	},
	loginLink: {
		color: "#28A745",
		fontWeight: "bold",
	},
});