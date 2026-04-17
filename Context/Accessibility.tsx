import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types exportés ────────────────────────────────────────────
export type FontConfig = {
  regular: string;
  semiBold: string;
  bold: string;
};

export type FontSize = {
  small: number;
  medium: number;
  large: number;
  xlarge: number;
};

type AccessibilityContextType = {
  accessibleFont: boolean;
  toggleFont: () => void;
  isLoading: boolean;
  fontSize: FontSize;
  fontFamily: FontConfig;
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);
const STORAGE_KEY = '@accessibility/font';

// ─── Polices disponibles ───────────────────────────────────────
const POPS_REGULAR = 'Poppins-Regular';
const POPS_SEMIBOLD = 'Poppins-SemiBold';
const POPS_BOLD = 'Poppins-Bold';

const ATK_REGULAR = 'Atkinson-Regular';
const ATK_BOLD = 'Atkinson-Bold';

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [accessibleFont, setAccessibleFont] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFontPreference();
  }, []);

  const loadFontPreference = async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      if (value !== null) {
        setAccessibleFont(JSON.parse(value));
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement de la police de préférence:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFont = async () => {
    try {
      const newValue = !accessibleFont;
      setAccessibleFont(newValue);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde préférence de la police:', error);
    }
  };

  const fontSize: FontSize = {
    small: accessibleFont ? 14 : 12,
    medium: accessibleFont ? 18 : 16,
    large: accessibleFont ? 24 : 20,
    xlarge: accessibleFont ? 40 : 36,
  };

  const fontFamily: FontConfig = {
    regular: accessibleFont ? ATK_REGULAR : POPS_REGULAR,
    semiBold: accessibleFont ? ATK_BOLD : POPS_SEMIBOLD,
    bold: accessibleFont ? ATK_BOLD : POPS_BOLD,
  };

  useEffect(() => {
    if (!isLoading) {
      console.log('-----------------------------------------');
      console.log(
        `Préférence de police chargée: ${accessibleFont ? 'Accessible (Atkinson)' : 'Normal (Poppins)'}`,
      );
      console.log(`Police 'bold' actuellement utilisée: ${fontFamily.bold}`);
      console.log('-----------------------------------------');
    }
  }, [accessibleFont, isLoading]);

  return (
    <AccessibilityContext.Provider
      value={{ accessibleFont, toggleFont, isLoading, fontSize, fontFamily }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

export function useAccessibleStyles() {
  const { fontSize, fontFamily } = useAccessibility();

  return {
    textSmall: { fontSize: fontSize.small, fontFamily: fontFamily.regular },
    textMedium: { fontSize: fontSize.medium, fontFamily: fontFamily.regular },
    textLarge: { fontSize: fontSize.large, fontFamily: fontFamily.regular },
    textXLarge: { fontSize: fontSize.xlarge, fontFamily: fontFamily.bold },
  };
}