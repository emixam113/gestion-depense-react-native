import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
// ✅ On importe la bonne fonction renommée
import { initNotifications } from "./NotificationService";

const NGROK_URL = 'https://eun-obvolutive-maynard.ngrok-free.dev';

export const API_URL = Platform.select({
  android: NGROK_URL,
  web: "http://localhost:3000",
}) as string;

type AuthResponse = {
  access_token: string;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    totalBalance?: number
  };
};

// ─── UTILS ─────────────────────────────────────────────────────────

export async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("userToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ─── AUTHENTIFICATION ──────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) throw new Error(data.message || "Erreur de connexion");

    if (data.access_token) {
      await AsyncStorage.setItem("userToken", data.access_token);

      // ✅ Lancement des notifications après login réussi
      try {
        const pushToken = await initNotifications();
        if (pushToken) {
          await registerPushToken(pushToken);
          console.log("🚀 [Push] Token enregistré avec succès");
        }
      } catch (pushErr) {
        console.warn("[Push] Erreur lors de l'initialisation du token:", pushErr);
      }
    }

    return data;
  } catch (error) {
    console.error("Erreur API login:", error);
    throw error;
  }
}

export async function register(userData: any): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  if (!response.ok) throw new Error("Erreur lors de l'inscription");
  return response.json();
}

// ─── HELPERS REQUÊTES AUTHENTIFIÉES ───────────────────────────────

export async function getWithAuth<T>(endpoint: string): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}${endpoint}`, { headers });
  if (!response.ok) throw new Error(`Erreur GET ${endpoint}`);
  return response.json();
}

export async function sendWithAuth(endpoint: string, method: string, body?: any) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`Erreur ${method} ${endpoint}`);
  return response.json();
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────

export async function registerPushToken(pushToken: string): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/notifications/register-token`, {
      method: "POST",
      headers,
      body: JSON.stringify({ pushToken }),
    });

    if (!response.ok) {
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};
      throw new Error(data.message || "Erreur enregistrement token push");
    }
    console.log("✅ [API] Token push synchronisé avec le backend");
  } catch (error) {
    console.error("❌ [API] Erreur registerPushToken:", error);
  }
}

// ─── DÉPENSES & CATÉGORIES ──────────────────────────────────────────

export async function getCategories(): Promise<any[]> {
  try {
    const data = await getWithAuth<any[]>("/categories");
    return data || [];
  } catch (error) {
    console.error("Erreur API getCategories:", error);
    return [];
  }
}

export async function getComparisonData(): Promise<any> {
   return getWithAuth("/expenses/comparison");
}

export async function getMyExpenses(): Promise<any[]> {
  return getWithAuth("/expenses/me");
}

export async function createExpense(expenseData: any): Promise<any> {
  return sendWithAuth("/expenses", "POST", expenseData);
}