import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

// Types
type Theme = 'light' | 'dark';
type ThemePreference = 'light' | 'dark' | 'system';

type Colors = {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    success: string;
    error: string;
    border: string;
    inputBackground: string;
    cardBackground: string;
};

type ThemeContextType = {
    theme: Theme;
    themePreference: ThemePreference;
    isDark: boolean;
    setThemePreference: (preference: ThemePreference) => void;
    setUserId: (userId: string | null) => void;
    colors: Colors;
    isLoading: boolean;
};

const lightColors: Colors = {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#555555',
    primary: '#2CC26D',
    success: '#2CC26D',
    error: '#FF6B6B',
    border: '#E0E0E0',
    inputBackground: '#F2F2F2',
    cardBackground: '#FFFFFF',
};

const darkColors: Colors = {
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    primary: '#2CC26D',
    success: '#2CC26D',
    error: '#FF6B6B',
    border: '#333333',
    inputBackground: '#2A2A2A',
    cardBackground: '#1E1E1E',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const STORAGE_KEY_PREFIX = '@theme/preference_';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [userId, setUserIdState] = useState<string | null>(null);
    const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
    const [theme, setTheme] = useState<Theme>('light');
    const [isLoading, setIsLoading] = useState(true);

    // Générer la clé de stockage avec l'ID utilisateur
    const getStorageKey = () => {
        return userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}guest`;
    };

    // Charger la préférence quand l'userId change
    useEffect(() => {
        if (userId !== null) {
            loadThemePreference();
        }
    }, [userId]);

    // Écouter les changements du thème système
    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            if (themePreference === 'system') {
                setTheme(colorScheme === 'dark' ? 'dark' : 'light');
                console.log("🌓 Thème système changé:", colorScheme);
            }
        });

        return () => subscription.remove();
    }, [themePreference]);

    const loadThemePreference = async () => {
        try {
            const storageKey = getStorageKey();
            const value = await AsyncStorage.getItem(storageKey);
            const preference = (value as ThemePreference) || 'system';

            setThemePreferenceState(preference);

            if (preference === 'system') {
                const systemTheme = Appearance.getColorScheme();
                setTheme(systemTheme === 'dark' ? 'dark' : 'light');
            } else {
                setTheme(preference);
            }

            console.log(`✅ Préférence chargée pour ${storageKey}:`, preference);
        } catch (error) {
            console.error("❌ Erreur lors du chargement du thème:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const setThemePreference = async (preference: ThemePreference) => {
        try {
            setThemePreferenceState(preference);

            if (preference === 'system') {
                const systemTheme = Appearance.getColorScheme();
                setTheme(systemTheme === 'dark' ? 'dark' : 'light');
            } else {
                setTheme(preference);
            }

            const storageKey = getStorageKey();
            await AsyncStorage.setItem(storageKey, preference);
            console.log(`✅ Préférence changée pour ${storageKey}:`, preference);
        } catch (error) {
            console.error("❌ Erreur lors de la sauvegarde du thème:", error);
        }
    };

    const setUserId = (newUserId: string | null) => {
        console.log("👤 UserID mis à jour:", newUserId);
        setUserIdState(newUserId);
        setIsLoading(true);
    };

    const colors = theme === 'light' ? lightColors : darkColors;
    const isDark = theme === 'dark';

    return (
        <ThemeContext.Provider value={{
            theme,
            themePreference,
            isDark,
            setThemePreference,
            setUserId,
            colors,
            isLoading,
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
}