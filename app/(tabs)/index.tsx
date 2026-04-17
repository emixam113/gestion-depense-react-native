import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Colors from '../../constants/Colors';
import { Link } from "expo-router";

// @ts-ignore
import logo from "../../assets/images/logo.png";

const Home = () => {
    return (
        <View style={styles.container}>
            <Image
                source={logo}
                style={styles.logo}
            />
            <Text style={styles.title}>L'outil pour la nouvelle finance</Text>

            {/* ✅ Utilisation de asChild pour éviter les conflits de clics */}
            <Link href="/screens/LoginScreen" asChild>
                <TouchableOpacity style={styles.buttonPrimary}>
                    <Text style={styles.buttonText}>Se Connecter</Text>
                </TouchableOpacity>
            </Link>

            <Link href="/screens/Signup" asChild>
                <TouchableOpacity style={styles.buttonSecondary}>
                    <Text style={styles.buttonText}>S'inscrire</Text>
                </TouchableOpacity>
            </Link>

            <Link href="/Forgot-Password" style={styles.forgotPasswordText}>
                Mot de passe oublié ?
            </Link>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.botlogin, // Vérifie bien que Colors.botlogin existe
    },
    logo: {
        width: 176,
        height: 176,
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24, // Augmenté un peu pour l'espace
        color: Colors.text || '#000', // Sécurité si Colors.text est undefined
    },
    buttonPrimary: {
        width: 220, // Légèrement plus large pour le confort Pixel 9
        paddingVertical: 12,
        borderRadius: 999,
        backgroundColor: Colors.primary,
        marginBottom: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonSecondary: {
        width: 220,
        paddingVertical: 12,
        borderRadius: 999,
        backgroundColor: Colors.secondary,
        marginBottom: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#FFFFFF', // Souvent blanc sur les boutons colorés
    },
    forgotPasswordText: {
        marginTop: 20,
        color: '#6b7280',
        textDecorationLine: 'underline',
    },
});

export default Home;