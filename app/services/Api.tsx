import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const API_URL = Platform.select({
  android: "http://192.168.1.45:3000",
  web: "http://localhost:3000",
});

// --- TYPES ---
type AuthResponse = {
  access_token: string;
  user?: { id: number; email: string; firstname: string; lastname: string };
};

type ApiError = { message: string; statusCode?: number };

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

    if (!response.ok) throw new Error(data.message || "Connexion échouée");

    if (data.access_token) await AsyncStorage.setItem("token", data.access_token);
    if (data.user) await AsyncStorage.setItem("user", JSON.stringify(data.user));

    return data as AuthResponse;
  } catch (error: any) {
    throw error;
  }
}

export async function signup(
  firstName: string, lastName: string, email: string,
  password: string, confirmPassword: string, birthDate: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstName, lastName, email, password, confirmPassword, birthDate }),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) throw new Error(data.message || "Inscription échouée");
  return data as AuthResponse;
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────

// ✅ AJOUT — manquait, importée dans LoginScreen
export async function registerPushToken(pushToken: string): Promise<void> {
  const token = await AsyncStorage.getItem("token");
  if (!token) return;

  const response = await fetch(`${API_URL}/notifications/register-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ pushToken }),
  });

  if (!response.ok) {
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    throw new Error(data.message || "Erreur enregistrement token push");
  }
}

// ─── UTILS AUTH ───────────────────────────────────────────────────

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("Non connecté");
  return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
}

export async function sendWithAuth<T>(endpoint: string, method: 'POST' | 'PUT' | 'PATCH', body: any): Promise<T> {
  const url = endpoint.startsWith("/") ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`;
  const response = await fetch(url, { method, headers: await getAuthHeaders(), body: JSON.stringify(body) });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data.message || "Erreur requête");
  return data as T;
}

export async function getWithAuth<T>(endpoint: string): Promise<T> {
  const url = endpoint.startsWith("/") ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`;
  const response = await fetch(url, { method: "GET", headers: await getAuthHeaders() });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(data.message || "Erreur récupération");
  return data as T;
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
}