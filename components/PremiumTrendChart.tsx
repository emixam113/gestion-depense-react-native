import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

// Types
import type { Expense } from '../Types';
import type { Colors } from '../Context/ThemeContext';
import type { FontConfig } from '../Context/Accessibility';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const prepareSubscriptionData = (expenses: Expense[]) => {
  const recurringExpenses = expenses.filter(
    (item) => item.isRecurring === true && item.type === 'expense'
  );

  const monthlyTotals: { [key: string]: number } = {};
  recurringExpenses.forEach((item) => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const amount = Math.abs(parseFloat(item.amount as any)) || 0;
    monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + amount;
  });

  const sortedMonths = Object.keys(monthlyTotals).sort();
  if (sortedMonths.length === 0) return [];

  return sortedMonths.map((key) => {
    const [year, month] = key.split('-');
    const monthLabel = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' });
    return {
      value: monthlyTotals[key],
      label: monthLabel,
      dataPointText: `${Math.round(monthlyTotals[key])}€`,
    };
  });
};

interface Props {
  expenses: Expense[];
  colors: Colors;
  fontFamily: FontConfig;
}

export default function SubscriptionTrendChart({ expenses, colors, fontFamily }: Props) {
  const chartData = useMemo(() => prepareSubscriptionData(expenses), [expenses]);

  // ✅ SOLUTION AXE TROP LONG :
  // On réduit la largeur totale et on définit un espacement fixe entre les points.
  const containerPadding = 40;
  const chartWidth = SCREEN_WIDTH - containerPadding - 60;

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fontFamily.bold }]}>
        COÛT MENSUEL DES FRAIS FIXES
      </Text>

      {/* Petit badge prévisionnel pour Netflix */}
      <View style={styles.nextBillBadge}>
         <Text style={styles.nextBillText}>🔔 Prochain : Netflix (13/06)</Text>
      </View>

      {chartData.length > 0 ? (
        <View style={styles.chartWrapper}>
          <LineChart
            data={chartData}
            width={chartWidth}
            height={160}
            // ✅ Fixe l'axe des abscisses
            initialSpacing={20}
            endSpacing={20}
            spacing={chartData.length > 1 ? chartWidth / (chartData.length - 0.5) : 0}

            // Design
            color="#FF6384"
            thickness={4}
            curved
            areaChart
            startFillColor="#FF6384"
            startFillOpacity={0.2}
            endFillColor="transparent"

            // Nettoyage des axes
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor="#E0E0E0"
            hideYAxisText
            hideRules

            // Points
            dataPointsColor="#FF6384"
            dataPointsRadius={5}
            showValuesAsDataPointsText
            textColor={colors.text}
            textFontSize={12}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Aucun frais fixe détecté.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 28,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  cardTitle: {
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  nextBillBadge: {
    backgroundColor: '#FFF0F3',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 20,
  },
  nextBillText: {
    color: '#FF6384',
    fontSize: 11,
    fontWeight: '700',
  },
  chartWrapper: {
    alignItems: 'center',
    marginLeft: -20, // Compense le décalage naturel de la librairie
  },
  emptyContainer: { height: 160, justifyContent: 'center' },
  emptyText: { textAlign: 'center', fontSize: 14 }
});