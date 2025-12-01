import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
type AccessibilityContextType = {
	accessibleFont: boolean;
	toggleFont: () => void;
	isLoading: boolean;
	fontSize: {
		small: number;
		medium: number;
		large: number;
		xlarge: number;
	};
	fontFamily: {
		regular: string;
		semiBold: string;
		bold: string;
	};
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);
const STORAGE_KEY = '@accessibility/font';

export function AccessibilityProvider({ children }: { children: ReactNode }) {
	const [accessibleFont, setAccessibleFont] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Charger la préférence au démarrage
	useEffect(() => {
		loadFontPreference();
	}, []);

	const loadFontPreference = async () => {
		try {
			const value = await AsyncStorage.getItem(STORAGE_KEY);
			if (value !== null) {
				setAccessibleFont(JSON.parse(value));
				console.log("✅ Préférence de police chargée:", JSON.parse(value) ? "Accessible" : "Normal");
			}
		} catch (error) {
			console.error("❌ Erreur lors du chargement de la police de préférence:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const toggleFont = async () => {
		try {
			const newValue = !accessibleFont;
			setAccessibleFont(newValue);
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
			console.log("✅ Police accessible:", newValue ? "Activée" : "Désactivée");
		} catch (error) {
			console.error("❌ Erreur lors de la sauvegarde préférence de la police:", error);
		}
	};

	// Font sizes (plus grands quand accessibleFont est activé)
	const fontSize = {
		small: accessibleFont ? 14 : 12,
		medium: accessibleFont ? 18 : 16,
		large: accessibleFont ? 24 : 20,
		xlarge: accessibleFont ? 40 : 36,
	};

	// Font family - doit correspondre exactement aux noms dans _layout.tsx
	const fontFamily = {
		regular: accessibleFont ? 'AtkinsonHyperlegible-Regular' : 'Poppins-Regular',
		semiBold: accessibleFont ? 'AtkinsonHyperlegible-Regular' : 'Poppins-SemiBold',
		bold: accessibleFont ? 'AtkinsonHyperlegible-Bold' : 'Poppins-Bold',
	};

	return (
		<AccessibilityContext.Provider value={{
			accessibleFont,
			toggleFont,
			isLoading,
			fontSize,
			fontFamily
		}}>
			{children}
		</AccessibilityContext.Provider>
	);
}

export function useAccessibility() {
	const context = useContext(AccessibilityContext);
	if (!context) {
		throw new Error("useAccessibility must be used within AccessibilityProvider");
	}
	return context;
}

// Hook helper pour obtenir les styles accessibles facilement
export function useAccessibleStyles() {
	const { fontSize, fontFamily } = useAccessibility();

	return {
		// Text styles prédéfinis
		textSmall: {
			fontSize: fontSize.small,
			fontFamily: fontFamily.regular,
		},
		textMedium: {
			fontSize: fontSize.medium,
			fontFamily: fontFamily.regular,
		},
		textLarge: {
			fontSize: fontSize.large,
			fontFamily: fontFamily.regular,
		},
		textXLarge: {
			fontSize: fontSize.xlarge,
			fontFamily: fontFamily.bold,
		},
	};
}