import React, {
  useMemo,
  useContext
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity
} from 'react-native';

import { LineChart } from 'react-native-gifted-charts';
import { useRouter } from 'expo-router';
import { LockKeyhole } from 'lucide-react-native';

import { SubscriptionsContext } from '../../Context/SubscriptionsProvider';

// Types
import type { Expense } from '../../Types';
import type { Colors } from '../../Context/ThemeContext';
import type { FontConfig } from '../../Context/Accessibility';

const { width } = Dimensions.get('window');

// --- Logique de calcul pour les Abonnements ---
const prepareSubscriptionData = (expenses: Expense[]) => {
  // 1. Filtrer uniquement les dépenses marquées comme récurrentes
  const recurringExpenses = expenses.filter(
    (item) => item.isRecurring === true && item.type === 'expense'
  );

  // 2. Grouper les montants par mois
  const monthlyTotals: { [key: string]: number } = {};

  recurringExpenses.forEach((item) => {
    const date = new Date(item.date);
    // Création d'une clé YYYY-MM pour le tri
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const amount = Math.abs(parseFloat(item.amount as any)) || 0;

    monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + amount;
  });

  // 3. Trier par date et formater pour le graphique
  const sortedMonths = Object.keys(monthlyTotals).sort();

  if (sortedMonths.length === 0) return [{ value: 0, label: 'N/A' }];

  return sortedMonths.map((key) => {
    const [year, month] = key.split('-');
    const monthLabel = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' });

    return {
      value: monthlyTotals[key],
      label: monthLabel,
      dataPointText: `${monthlyTotals[key]}€` // Affiche le prix sur le point
    };
  });
};

// --- Composant Principal ---
export default function SubscriptionTrendChart({
  expenses,
  colors,
  fontFamily
}: {
  expenses: Expense[];
  colors: Colors;
  fontFamily: FontConfig
}) {
  const router = useRouter();

  const {
    isPremium,
    loading
  } = useContext(SubscriptionsContext);

  const chartData = useMemo(
    () => prepareSubscriptionData(expenses),
    [expenses]
  );

  // Vue si l'utilisateur n'est pas Premium (Protection Paywall)
  if (!loading && !isPremium) {
    return (
      <View style={[
        styles.card,
        { backgroundColor: colors.cardBackground }
      ]}>
        <View style={styles.promoContainer}>
          <LockKeyhole
            color={colors.primary}
            size={32}
          />

          <Text style={[
            styles.promoTitle,
            { color: colors.text, fontFamily: fontFamily.bold }
          ]}>
            Analyse des Abonnements
          </Text>

          <Text style={[styles.promoSubtitle, { color: colors.textSecondary }]}>
            Visualisez le coût réel de vos frais fixes chaque mois.
          </Text>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary }
            ]}
            onPress={() => router.push('/(tabs)/OfferScreen')}
          >
            <Text style={styles.buttonText}>
              Débloquer l'analyse
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Vue si l'utilisateur est Premium
  return (
    <View style={[
      styles.card,
      { backgroundColor: colors.cardBackground }
    ]}>
      <Text style={[
        styles.cardTitle,
        { color: colors.text, fontFamily: fontFamily.bold }
      ]}>
        Coût Mensuel des Frais Fixes
      </Text>

      <LineChart data={chartData}
                 width={width - 70}
                 height={180}
                 color="#FF6384"
                 thickness={3}
                 curved
                 animateOnDataChange
                 animationDuration={1000}
                 areaChart
                 startFillColor='#FF6384'
                 startFillOpacity={0.2}
                 endOpacity={0.05}
                 noOfSections={3}
                 hideRules
                 yAxisColor="transparent"
                 xAxisColor={colors.textSecondary}
                 xAxisLabelTextStyle={{ colors: colors.textSecondary, fontSize: 10}}
                 pointerConfig={{
                    pointerStripColor: '#FF6384',
                    pointerEvents: 'none',
                 }}
      />
    </View>
  );
}


const styles= StyleSheet.create({

   card: {
        margin: 16,
        padding: 20,
        borderRadius: 24,
        minHeight: 220,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
   },

    cardTitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },

    promoTitle: {
        flex: 1,
        alignItem: 'center',
        justifyContent: 'center',
        gap: 8,
    },

    promoSubtitle: {
        fontSize: 18,
        textAlign:'center',
        marginBottom: 8,
        paddingHorizontal: 10,
    },

    button: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius:12,
        marginTop: 10,
    },

    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
})