import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Adresse IP de ton PC pour React Native
const API_URL = Platform.select({
	android: "http://192.168.1.39:3000",
	web: "http://localhost:3000",
});

// --- TYPES ---
type AuthResponse = {
	access_token: string;
	user?: {
		id: number;
		email: string;
		firstname: string;
		lastname: string;
	};
};

type ApiError = {
	message: string;
	statusCode?: number;
};

// --- AUTHENTIFICATION ---

// 1. LOGIN
export async function login(email: string, password: string): Promise<AuthResponse> {
	console.log("Tentative de login pour :", email);

	try {
		const response = await fetch(`${API_URL}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});

		const data = await response.json();
		if (!response.ok) {
			const errorData = data as ApiError;
			throw new Error(errorData.message || "Email ou mot de passe incorrect");
		}

		const authData = data as AuthResponse;
		if (authData.access_token) await AsyncStorage.setItem("token", authData.access_token);
		if (authData.user) await AsyncStorage.setItem("user", JSON.stringify(authData.user));

		return authData;
	} catch (error: any) {
		console.error("Erreur Login:", error.message);
		throw error;
	}
}

// 2. SIGNUP
export async function signup(
	firstName: string,
	lastName: string,
	email: string,
	password: string,
	confirmPassword: string,
	birthDate: string
): Promise<AuthResponse> {
	console.log("Tentative de signup :", email);

	try {
		const response = await fetch(`${API_URL}/auth/signup`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				firstName,
				lastName,
				email,
				password,
				confirmPassword,
				birthDate,
			}),
		});

		const data = await response.json();
		if (!response.ok) {
			const errorData = data as ApiError;
			throw new Error(errorData.message || "Erreur lors de l'inscription");
		}

		const authData = data as AuthResponse;
		if (authData.access_token) await AsyncStorage.setItem("token", authData.access_token);
		if (authData.user) await AsyncStorage.setItem("user", JSON.stringify(authData.user));

		return authData;
	} catch (error: any) {
		console.error("Erreur Signup:", error.message);
		throw error;
	}
}

// 3. LOGOUT
export async function logout(): Promise<void> {
	try {
		await AsyncStorage.removeItem("token");
		await AsyncStorage.removeItem("user");
	} catch (e) {
		console.error("Erreur lors du logout", e);
	}
}

// --- REQUÊTES PROTÉGÉES (AVEC AUTH) ---

// Fonction utilitaire pour lire le corps JSON ou gérer le 204/vide
async function readJsonResponse<T>(response: Response): Promise<T> {
	const text = await response.text();
	// Gère le cas où la réponse est vide (No Content ou autre)
	return text ? JSON.parse(text) : {} as T;
}

// 4. GET (Lecture)
export async function getWithAuth<T>(endpoint: string): Promise<T> {
	const token = await AsyncStorage.getItem("token");
	if (!token) {
		throw new Error("Utilisateur non connecté");
	}

	const url = endpoint.startsWith("/") ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`;

	try {
		const response = await fetch(url, {
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!response.ok) {
			const errorData = await readJsonResponse<ApiError>(response);
			throw new Error(errorData.message || "Erreur lors de la requête protégée");
		}

		return readJsonResponse<T>(response);
	} catch (error: any) {
		console.error(`Erreur GET ${endpoint}:`, error.message);
		throw error;
	}
}

// 5. SEND (Création/Modification - POST/PUT/PATCH)
export async function sendWithAuth<T>(
	endpoint: string,
	method: 'POST' | 'PUT' | 'PATCH',
	body: any
): Promise<T> {
	const token = await AsyncStorage.getItem("token");
	if (!token) {
		throw new Error("Utilisateur non connecté");
	}

	const url = endpoint.startsWith("/") ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`;

	try {
		const response = await fetch(url, {
			method: method,
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errorData = await readJsonResponse<ApiError>(response);
			throw new Error(errorData.message || `Erreur lors de la requête ${method} protégée`);
		}

		return readJsonResponse<T>(response);
	} catch (error: any) {
		console.error(`Erreur ${method} ${endpoint}:`, error.message);
		throw error;
	}
}

// 6. DELETE (Suppression)
export async function deleteWithAuth<T>(endpoint: string): Promise<T> {
	const token = await AsyncStorage.getItem("token");
	if (!token) {
		throw new Error("Utilisateur non connecté");
	}

	const url = endpoint.startsWith("/") ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`;

	try {
		const response = await fetch(url, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${token}` },
		});

		// Gérer le 204 No Content
		if (response.status === 204) {
			return {} as T;
		}

		if (!response.ok) {
			const errorData = await readJsonResponse<ApiError>(response);
			throw new Error(errorData.message || "Erreur lors de la suppression");
		}

		return readJsonResponse<T>(response);
	} catch (error: any) {
		console.error(`Erreur DELETE ${endpoint}:`, error.message);
		throw error;
	}
}