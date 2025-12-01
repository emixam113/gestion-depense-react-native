import { AccessibilityProvider } from './Context/Accessibility';
import { useFonts } from 'expo-font';
import {
	Poppins_400Regular,
	Poppins_600SemiBold,
	Poppins_700Bold
} from '@expo-google-fonts/poppins';
import {
	AtkinsonHyperlegible_400Regular,
	AtkinsonHyperlegible_700Bold
} from '@expo-google-fonts/atkinson-hyperlegible';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Stack } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const [fontsLoaded] = useFonts({
		'Poppins-Regular': Poppins_400Regular,
		'Poppins-SemiBold': Poppins_600SemiBold,
		'Poppins-Bold': Poppins_700Bold,
		'AtkinsonHyperlegible-Regular': AtkinsonHyperlegible_400Regular,
		'AtkinsonHyperlegible-Bold': AtkinsonHyperlegible_700Bold,
	});

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	if (!fontsLoaded) {
		return null;
	}

	return (
		<AccessibilityProvider>
			<Stack />
		</AccessibilityProvider>
	);
}