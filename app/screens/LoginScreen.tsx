import React, { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Image,
	Alert,
	ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login } from "../services/Api";

// ⭐️ Optimisation : Centralisation des imports d'assets pour la lisibilité
const logo = require("../../assets/images/logo.png");
const eyeVisible = require("../../assets/images/Vector.png");
const eyeHidden = require('../../assets/images/Eye-Pass.png');

const LoginScreen = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleLogin = async () => {
		if (!email || !password) {
			Alert.alert("Erreur", "Veuillez remplir tous les champs.");
			return;
		}

		setIsLoading(true);
		try {
			const authData = await login(email, password);

			// console.log("Token reçu :", authData.access_token);
			// console.log("User :", authData.user);

			await AsyncStorage.setItem("user", JSON.stringify(authData.user));
			await AsyncStorage.setItem("token", authData.access_token);

			Alert.alert("Succès", "Connexion réussie !");
			// Navigation : Remplacement de l'écran (bonne pratique post-login)
			router.replace("/(tabs)");
		} catch (err) { // ✅ Correction : Syntaxte JavaScript standard
			console.error("Erreur login:", err);
			// Gestion robuste des erreurs
			const errorMessage = err instanceof Error ? err.message : "Impossible de se connecter au serveur";
			Alert.alert("Erreur", errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<View style={styles.outerContainer}>
			<View style={styles.topContainer}>
				<View style={styles.logoContainer}>
					<Image source={logo} style={styles.logo} />
				</View>
				<Text style={styles.tagline}>L'outil pour la nouvelle finance</Text>
			</View>

			<Text style={styles.welcomeTitle}>Bienvenue</Text>

			<View style={styles.formContainer}>
				<Text style={styles.label}>E-mail</Text>
				<TextInput
					style={styles.input}
					placeholder="exemple@exemple.com"
					placeholderTextColor="#888"
					keyboardType="email-address"
					autoCapitalize="none"
					value={email}
					onChangeText={setEmail}
				/>

				<Text style={styles.label}>Mot de passe</Text>
				<View style={styles.passwordInputContainer}>
					<TextInput
						style={styles.passwordInput}
						placeholder="*************"
						placeholderTextColor="#888"
						secureTextEntry={!isPasswordVisible}
						value={password}
						onChangeText={setPassword}
					/>
					<TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
						<Image
							// Utilisation des variables optimisées
							source={isPasswordVisible ? eyeVisible : eyeHidden}
							style={styles.eyeIcon}
						/>
					</TouchableOpacity>
				</View>

				<TouchableOpacity
					style={styles.loginButton}
					onPress={handleLogin}
					disabled={isLoading}
				>
					{isLoading ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={styles.buttonText}>Se Connecter</Text>
					)}
				</TouchableOpacity>
			</View>

			<View style={styles.signupTextContainer}>
				<Text style={styles.signupText}>Pas encore de compte ?</Text>
				<TouchableOpacity onPress={()=> router.push("/screens/Signup")}>
					<Text style={styles.signupLink}> S'inscrire</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
  outerContainer: {
   flex: 1,
   backgroundColor: "#EAF7EF",
   alignItems: "center",
  },
  topContainer: {
   flexDirection: "row",
   alignItems: "center",
   justifyContent: "flex-start",
   width: "100%",
   padding: 20,
  },
  logoContainer: {
   backgroundColor: "#28A745",
   width: 50,
   height: 50,
   borderRadius: 10,
   justifyContent: "center",
   alignItems: "center",
  },
  logo: {
   width: 40,
   height: 40,
  },
  tagline: {
   fontSize: 14,
   fontWeight: "bold",
   marginLeft: 10,
  },
  welcomeTitle: {
   fontSize: 30,
   fontWeight: "bold",
   marginTop: 50,
   marginBottom: 30,
  },
  formContainer: {
   backgroundColor: "#A8E3B6",
   width: "90%",
   padding: 20,
   borderRadius: 20,
   alignItems: "flex-start",
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
   height: 40,
   backgroundColor: "#fff",
   borderRadius: 10,
   paddingHorizontal: 15,
   marginBottom: 10,
  },
  passwordInputContainer: {
   flexDirection: "row",
   alignItems: "center",
   width: "100%",
   backgroundColor: "#fff",
   borderRadius: 10,
   paddingHorizontal: 15,
   marginBottom: 10,
  },
  passwordInput: {
   flex: 1,
   height: 40,
  },
  eyeIcon: {
   width: 20,
   height: 20,
   marginLeft: 10,
  },
  loginButton: {
   width: "60%",
   alignSelf: "center",
   backgroundColor: "#8BC34A",
   padding: 12,
   borderRadius: 50,
   alignItems: "center",
   marginTop: 20,
  },
  buttonText: {
   color: "#fff",
   fontWeight: "bold",
   fontSize: 16,
  },
  signupTextContainer: {
   flexDirection: "row",
   marginTop: 40,
  },
  signupText: {
   color: "#333",
  },
  signupLink: {
   color: "#28A745",
   fontWeight: "bold",
  },
});

export default LoginScreen;