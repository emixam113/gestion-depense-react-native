// services/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.1.37:3000";



type LoginResponse = {
    access_token: string;
};

export async function login(email: string, password: string): Promise<string> {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        throw new Error("Email ou mot de passe incorrect");
    }

    const data: LoginResponse = await response.json();

    // Stocke le token dans AsyncStorage
    await AsyncStorage.setItem("token", data.access_token);

    return data.access_token;
}

export async function register(
    email: string,
    password: string,
    username: string
): Promise<void> {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }),
    });

    if (!response.ok) {
        throw new Error("Erreur lors de l'inscription");
    }
}

export async function getWithAuth(endpoint: string): Promise<any> {
    const token = await AsyncStorage.getItem("token");

    if (!token) {
        throw new Error("Utilisateur non connecté");
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
        throw new Error("Erreur lors de la requête protégée");
    }

    return await response.json();
}
