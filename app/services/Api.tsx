import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ─── IP de votre PC sur le réseau local ──────────────────────────────
const API_URL = Platform.select({
  android: "http://192.168.1.37:3000", // ← votre IP locale
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
      body: JSON.stringify({ firstName, lastName, email, password, confirmPassword, birthDate }),
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

// ─── UTILITAIRE JSON ──────────────────────────────────────────────────
async function readJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? JSON.parse(text) : {} as T;
}

// 4. GET
export async function getWithAuth<T>(endpoint: string): Promise<T> {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("Utilisateur non connecté");

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

// 5. SEND (POST / PUT / PATCH)
export async function sendWithAuth<T>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH',
  body: any
): Promise<T> {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("Utilisateur non connecté");

  const url = endpoint.startsWith("/") ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`;
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await readJsonResponse<ApiError>(response);
      throw new Error(errorData.message || `Erreur lors de la requête ${method}`);
    }
    return readJsonResponse<T>(response);
  } catch (error: any) {
    console.error(`Erreur ${method} ${endpoint}:`, error.message);
    throw error;
  }
}

// 6. DELETE
export async function deleteWithAuth<T>(endpoint: string): Promise<T> {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("Utilisateur non connecté");

  const url = endpoint.startsWith("/") ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`;
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 204) return {} as T;
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

// ════════════════════════════════════════════════════════════════
// 7. ENREGISTRER LE TOKEN PUSH — à appeler après le login
// ════════════════════════════════════════════════════════════════
export async function registerPushToken(pushToken: string): Promise<void> {
  try {
    await sendWithAuth('/notifications/register-token', 'POST', { pushToken });
    console.log('[Push] Token enregistré sur le backend ✅');
  } catch (error: any) {
    // Ne pas bloquer l'app si l'enregistrement échoue
    console.warn('[Push] Impossible d\'enregistrer le token:', error.message);
  }
}