// services/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://192.168.1.39:3000"; // ⚠️ Vérifie que ton backend écoute bien sur cette IP

// Réponse attendue lors du login/signup
type AuthResponse = {
    access_token: string;
    user?: {
        id: number;
        email: string;
        firstname: string;
        lastname: string;
    };
};

// ---- LOGIN ----
export async function login(email: string, password: string): Promise<AuthResponse> {
    console.log("👉 Tentative de login", email, password);

    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    console.log("📡 Login status:", response.status);

    const data: AuthResponse = await response.json().catch(() => null);
    console.log("📩 Réponse login JSON:", data);

    if (!response.ok || !data) {
        throw new Error(data?.message || "Email ou mot de passe incorrect");
    }

    // ✅ Stocker token et user
    if (data.access_token) {
        await AsyncStorage.setItem("token", data.access_token);
    }
    if (data.user) {
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
}

// ---- SIGNUP ----
export async function signup(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    confirmPassword: string,
    birthDate: string
): Promise<AuthResponse> {
    console.log("👉 Tentative de signup avec :", { firstName, lastName, email, birthDate });

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

    console.log("📡 Signup status:", response.status);

    const data: AuthResponse = await response.json().catch(() => null);
    console.log("📩 Réponse signup JSON:", data);

    if (!response.ok || !data) {
        throw new Error(data?.message || "Erreur lors de l'inscription");
    }

    // ✅ Stocker token et user
    if (data.access_token) {
        await AsyncStorage.setItem("token", data.access_token);
    }
    if (data.user) {
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
}

// ---- REQUÊTES PROTÉGÉES ----
export async function getWithAuth(endpoint: string): Promise<any> {
    const token = await AsyncStorage.getItem("token");
    console.log("🔑 Token récupéré depuis AsyncStorage:", token);

    if (!token) {
        throw new Error("Utilisateur non connecté");
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    console.log("📡 Requête protégée status:", response.status);

    const data = await response.json().catch(() => null);
    console.log("📩 Réponse requête protégée:", data);

    if (!response.ok) {
        throw new Error(data?.message || "Erreur lors de la requête protégée");
    }

    return data;
}

// ---- LOGOUT ----
export async function logout(): Promise<void> {
    console.log("🚪 Déconnexion en cours...");
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
}
