import AsyncStorage from "@react-native-async-storage/async-storage";

// Adresse IP de ton PC via Wi-Fi
const API_URL = "http://192.168.1.37:3000";

// Type pour la réponse de succès
type AuthResponse = {
    access_token: string;
    user?: {
        id: number;
        email: string;
        firstname: string;
        lastname: string;
    };
};

// Type pour gérer les erreurs renvoyées par l'API
type ApiError = {
    message: string;
    statusCode?: number;
};

// ---- LOGIN ----
export async function login(email: string, password: string): Promise<AuthResponse> {
    console.log("Tentative de login pour :", email);

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        console.log("Login status:", response.status);

        const data = await response.json();

        if (!response.ok) {
            const errorData = data as ApiError;
            throw new Error(errorData.message || "Email ou mot de passe incorrect");
        }

        // Stocker token et user
        const authData = data as AuthResponse;
        if (authData.access_token) {
            await AsyncStorage.setItem("token", authData.access_token);
        }
        if (authData.user) {
            await AsyncStorage.setItem("user", JSON.stringify(authData.user));
        }

        return authData;

    } catch (error: any) {
        console.error("Erreur Login:", error.message);
        throw error;
    }
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

        console.log("Signup status:", response.status);
        const data = await response.json();

        if (!response.ok) {
            const errorData = data as ApiError;
            throw new Error(errorData.message || "Erreur lors de l'inscription");
        }

        // Stocker token et user
        const authData = data as AuthResponse;
        if (authData.access_token) {
            await AsyncStorage.setItem("token", authData.access_token);
        }
        if (authData.user) {
            await AsyncStorage.setItem("user", JSON.stringify(authData.user));
        }

        return authData;

    } catch (error: any) {
        console.error("Erreur Signup:", error.message);
        throw error;
    }
}

// ---- REQUÊTES PROTÉGÉES (Générique T) ----
export async function getWithAuth<T>(endpoint: string): Promise<T> {
    const token = await AsyncStorage.getItem("token");

    if (!token) {
        console.warn("Pas de token trouvé");
        throw new Error("Utilisateur non connecté");
    }

    const url = endpoint.startsWith("/") ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`;

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        console.log(`GET ${endpoint} status:`, response.status);

        const data = await response.json();

        if (!response.ok) {
            const errorData = data as ApiError;
            throw new Error(errorData.message || "Erreur lors de la requête protégée");
        }

        return data as T;

    } catch (error: any) {
        console.error(`Erreur GET ${endpoint}:`, error.message);
        throw error;
    }
}

// ---- LOGOUT ----
export async function logout(): Promise<void> {
    console.log("Déconnexion...");
    try {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
    } catch (e) {
        console.error("Erreur lors du logout", e);
    }
}