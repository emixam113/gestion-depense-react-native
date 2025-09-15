// components/Home.tsx
import React from "react";
import {View, Text, StyleSheet, Image, TouchableOpacity} from "react-native";
import Colors from '../../constants/Colors';
import {Link} from "expo-router";

// logo png
const logo = require('../../assets/images/logo.png');

const Home = ()=> {
    return (
        <View
            View style={styles.container}>
            <Image
                source={logo}
                style={styles.logo}
            />
            <Text style={styles.title}>L'outil pour la nouvelle finance</Text>

            <TouchableOpacity style={styles.buttonPrimary}>
                <Link href="/screens/LoginScreen" style={styles.buttonText}> Se Connecter </Link>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonSecondary}>
                <Link href="/screens/Signup" style={styles.buttonText}>S'inscrire</Link>
            </TouchableOpacity>

            <Link href="/forgot-password" style={styles.forgotPasswordText}>Mot de passe oublié ?</Link>
        </View>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.botlogin,
    },
    content: {
        padding: 24,
        borderRadius: 8,
        alignItems: 'center',
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
        marginBottom: 8,
    },
    buttonPrimary: {
        width: 192,
        paddingVertical: 8,
        marginTop: 8,
        borderRadius: 999,
        backgroundColor: Colors.primary,
        margin: 16,
    },
    buttonSecondary: {
        width: 192,
        paddingVertical: 8,
        marginTop: 8,
        borderRadius: 999,
        backgroundColor: Colors.secondary,
        margin: 16,
    },
    buttonText: {
        fontWeight: 'bold',
        textAlign: 'center',
        color: Colors.text,
    },
    forgotPasswordText: {
        color: '#6b7280',
        textDecorationLine: 'underline',
    },
});
export default Home