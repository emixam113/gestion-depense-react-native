import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { register } from '../services/Api'; // ✅ API register

const logo = require('../../assets/images/logo.png');

const SignupScreen = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const router = useRouter();

    const handleSignup = async () => {
        if (!email || !password || !firstName || !lastName) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
            return;
        }

        try {
            // 🔑 Appel API
            await register(email, password, `${firstName} ${lastName}`);

            Alert.alert('Succès', 'Votre compte a été créé !');
            router.replace('/login'); // redirige vers login
        } catch (err: any) {
            Alert.alert('Erreur', err.message || "Impossible de créer un compte");
        }
    };

    return (
        <View style={styles.outerContainer}>
            {/* Logo + tagline */}
            <View style={styles.topContainer}>
                <View style={styles.logoContainer}>
                    <Image source={logo} style={styles.logo} />
                </View>
                <Text style={styles.tagline}>L'outil pour la nouvelle finance</Text>
            </View>

            {/* Titre */}
            <Text style={styles.signupTitle}>Création d'un compte</Text>

            {/* Formulaire */}
            <View style={styles.formContainer}>
                <View style={styles.row}>
                    {/* Nom */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nom</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Dupont"
                            placeholderTextColor="#888"
                            value={lastName}
                            onChangeText={setLastName}
                        />
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>E-mail</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="exemple@exemple.com"
                            placeholderTextColor="#888"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    {/* Prénom */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Prénom</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Jean"
                            placeholderTextColor="#888"
                            value={firstName}
                            onChangeText={setFirstName}
                        />
                    </View>

                    {/* Mot de passe */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mot de passe</Text>
                        <View style={styles.passwordInputContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="*************"
                                placeholderTextColor="#888"
                                secureTextEntry={!isPasswordVisible}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                            >
                                <Image
                                    source={
                                        isPasswordVisible
                                            ? require('../../assets/images/Eye-Pass.png')
                                            : require('../../assets/images/Vector.png')
                                    }
                                    style={styles.eyeIcon}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.row}>
                    {/* Date de naissance (facultatif pour l’API) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date de naissance</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="01/01/1968"
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                            value={birthDate}
                            onChangeText={setBirthDate}
                        />
                    </View>

                    {/* Confirmation */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirmation</Text>
                        <View style={styles.passwordInputContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="*************"
                                placeholderTextColor="#888"
                                secureTextEntry={!isConfirmPasswordVisible}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                            <TouchableOpacity
                                onPress={() =>
                                    setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                                }
                            >
                                <Image
                                    source={
                                        isConfirmPasswordVisible
                                            ? require('../../assets/images/Eye-Pass.png')
                                            : require('../../assets/images/Vector.png')
                                    }
                                    style={styles.eyeIcon}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Conditions + bouton */}
                <Text style={styles.termsText}>
                    En cliquant, vous acceptez les conditions générales d'utilisation
                </Text>
                <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
                    <Text style={styles.buttonText}>S'inscrire</Text>
                </TouchableOpacity>
            </View>

            {/* Lien vers login */}
            <View style={styles.loginTextContainer}>
                <Text style={styles.loginText}>Déjà un compte ?</Text>
                <Link href="/login" style={styles.loginLink}>
                    {' '}
                    Se connecter
                </Link>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: '#EAF7EF',
        alignItems: 'center',
    },
    topContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        padding: 20,
    },
    logoContainer: {
        backgroundColor: '#28A745',
        width: 50,
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 40,
        height: 40,
    },
    tagline: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    signupTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 30,
        marginBottom: 20,
    },
    formContainer: {
        backgroundColor: '#A8E3B6',
        width: '90%',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 15,
    },
    inputGroup: {
        width: '48%',
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    input: {
        width: '100%',
        height: 40,
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 15,
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 15,
    },
    passwordInput: {
        flex: 1,
        height: 40,
    },
    eyeIcon: {
        width: 20,
        height: 20,
        marginLeft: 10,
    },
    termsText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 15,
    },
    signupButton: {
        width: '60%',
        backgroundColor: '#8BC34A',
        padding: 12,
        borderRadius: 50,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    loginTextContainer: {
        flexDirection: 'row',
        marginTop: 20,
    },
    loginText: {
        color: '#333',
    },
    loginLink: {
        color: '#28A745',
        fontWeight: 'bold',
    },
});

export default SignupScreen;
