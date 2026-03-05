import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { getCategoryColor } from "../Utils/Colors";
import { useAccessibility } from "../Context/Accessibility";
import { useTheme } from "../Context/ThemeContext";

type GraphProps = {
    revenus?: Record<string, number>;
    depenses?: Record<string, number>;
    categoryColors?: Record<string, string>;
};

const screenWidth = Dimensions.get("window").width;
const CHART_RADIUS = 120;

export default function Graph({
    revenus = {},
    depenses = {},
    categoryColors = {},
}: GraphProps) {
    const { fontFamily } = useAccessibility();
    const { colors, isDark } = useTheme();

    const incomeData = Object.entries(revenus).map(([name, value], index) => ({
        name,
        value,
        color: getCategoryColor(name, categoryColors[name], index),
    }));

    const expenseData = Object.entries(depenses).map(([name, value], index) => ({
        name,
        value,
        color: getCategoryColor(name, categoryColors[name], index),
    }));

    const formatValue = (val: number) =>
        val.toLocaleString("fr-FR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }) + " €";

    const renderPieChart = (data: typeof incomeData, title: string) => {
        const totalValue = data.reduce((s, v) => s + v.value, 0);

        return (
            <View
                style={[
                    styles.graphWrapper,
                    {
                        width: screenWidth-90,
                        backgroundColor: colors.cardBackground,
                        shadowColor: isDark ? "#000" : "#aaa",
                    },
                ]}
            >
                <Text
                    style={[
                        styles.title,
                        { fontFamily: fontFamily.bold, color: colors.text },
                    ]}
                >
                    {title}
                </Text>

                {data.length > 0 ? (
                    <View style={styles.chartContainer}>
                        <View style={styles.pieChartWrapper}>
                            <PieChart
                                donut
                                data={data}
                                radius={CHART_RADIUS}
                                innerRadius={CHART_RADIUS * 0.6}
                                showText
                                textColor={colors.textSecondary}
                                textSize={12}
                                fontFamily={fontFamily.regular}

                            />

                            <View style={styles.centerTextContainer}>
                                <Text
                                    style={[
                                        styles.centerText,
                                        {
                                            fontFamily: fontFamily.bold,
                                            color: colors.text,
                                        },
                                    ]}
                                >
                                    {formatValue(totalValue)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.legendContainer}>
                            {data.map((entry) => (
                                <View key={entry.name} style={styles.legendItem}>
                                    <View
                                        style={[
                                            styles.legendDot,
                                            { backgroundColor: entry.color },
                                        ]}
                                    />
                                    <Text
                                        style={[
                                            styles.legendText,
                                            {
                                                fontFamily: fontFamily.regular,
                                                color: colors.textSecondary,
                                            },
                                        ]}
                                    >
                                        {entry.name} ({formatValue(entry.value)})
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : (
                    <Text
                        style={[
                            styles.emptyText,
                            {
                                fontFamily: fontFamily.regular,
                                color: colors.textSecondary,
                            },
                        ]}
                    >
                        Aucune donnée pour {title.toLowerCase()}
                    </Text>
                )}
            </View>
        );
    };

    return (
        <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
        >
            {renderPieChart(incomeData, "Revenus par source")}
            {renderPieChart(expenseData, "Dépenses par catégorie")}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        alignItems: "center",
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    graphWrapper: {
        marginHorizontal: 0,
        padding: 15,
        borderRadius: 12,
        elevation: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        minHeight: 260,
        justifyContent: "center",
    },
    title: {
        textAlign: "center",
        fontSize: 18,
        marginBottom: 15,
    },
    chartContainer: {
        flexDirection: "column",
        alignItems: "center",
    },
    pieChartWrapper: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerTextContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
    },
    centerText: {
        fontSize: 18,
        textAlign: 'center',
    },
    legendContainer: {
        marginTop: 20,
        width: "90%",
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 4,
        flexWrap: "wrap",
    },
    legendDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 6,
    },
    legendText: {
        fontSize: 14,
        marginRight: 6,
    },
    emptyText: {
        textAlign: "center",
        paddingVertical: 20,
        fontSize: 14,
    },
});