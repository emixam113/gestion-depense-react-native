import { AccessibilityProvider } from './Context/Accessibility';
import { ThemeProvider } from './Context/ThemeContext';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { NotificationService } from './services/NotificationService';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
       'Atkinson-Regular': require('../assets/fonts/AtkinsonHyperlegible-Regular.ttf'),
       'Atkinson-Bold': require('../assets/fonts/AtkinsonHyperlegible-Bold.ttf')
    });

    // Gestion du Splash Screen
    useEffect(() => {
       if (fontsLoaded) {
          SplashScreen.hideAsync();
       }
    }, [fontsLoaded]);

    // --- INITIALISATION DES NOTIFICATIONS ---
    useEffect(() => {
        const setupNotifications = async () => {
            // Demande la permission à l'utilisateur
            const hasPermission = await NotificationService.requestPermissions();

            if (hasPermission) {
                // Configure un rappel quotidien par défaut à 20h00
                // Tu pourras plus tard rendre cela réglable dans les paramètres
                await NotificationService.scheduleDailyReminder(20, 0);
                console.log("Notifications configurées avec succès !");
            } else {
                console.log("Permissions de notification refusées.");
            }
        };

        setupNotifications();
    }, []);

 if (!fontsLoaded) {
       return null;
 }

    return (
       <ThemeProvider>
          <AccessibilityProvider>
             <Stack />
          </AccessibilityProvider>
       </ThemeProvider>
    );
}