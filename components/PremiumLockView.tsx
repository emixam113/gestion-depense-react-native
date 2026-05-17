import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native'; //
import { useTheme } from '../Context/ThemeContext'; //
import { useAccessibility } from '../Context/Accessibility'; //

interface PremiumLockViewProps {
    title: string;
    description: string;
    buttonLabel?: string; // ✅ Rendu dynamique
    onUnlock?: () => void;
}

export default function PremiumLockView({
    title,
    description,
    buttonLabel = "Débloquer le Premium", // Valeur par défaut
    onUnlock

}: PremiumLockViewProps) {
    const { colors } = useTheme(); //
    const { fontFamily } = useAccessibility(); //

    return (
        <View style={[styles.paywallContainer, { backgroundColor: colors.cardBackground, borderColor: colors.primary }]}>
            {/* ✅ Icône Lucide harmonisée avec remplissage jaune */}
            <Star size={80} color="#FACC15" fill="#FACC15" style={styles.paywallStar} />

            <Text style={[styles.paywallTitle, { color: colors.text, fontFamily: fontFamily.bold }]}>
                {title}
            </Text>

            <Text style={[styles.paywallText, { color: colors.textSecondary, fontFamily: fontFamily.regular }]}>
                {description}
            </Text>

            <TouchableOpacity
                style={[styles.paywallButton, { backgroundColor: colors.primary }]}
                onPress={onUnlock}
                activeOpacity={0.8}
            >
                <Text style={[styles.paywallButtonText, { fontFamily: fontFamily.bold }]}>
                    {buttonLabel}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    paywallContainer: {
       padding: 25,
       borderRadius: 30,
       justifyContent: 'center',
       alignItems: 'center',
       borderWidth: 1.5,
       minHeight: 400
    },

    paywallStar: {
        marginBottom: 20,
    },

    paywallTitle: {
        fontSize: 20,
        textAlign: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },

    paywallText: {
         fontSize: 14,
         textAlign: 'center',
         lineHeight: 20,
         marginBottom: 30,
         paddingHorizontal: 10,
    },

    paywallButton: {
        width: "100%",
        paddingVertical: 15,
        borderRadius: 14,
        alignItems: 'center',
        elevation: 3,
    },

    paywallButtonText: {
       color: "#fff",
       fontSize: 16,
    },
})