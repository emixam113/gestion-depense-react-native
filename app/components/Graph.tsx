import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { getCategoryColor } from "../Utils/Colors";

type GraphProps = {
	revenus?: Record<string, number>;
	depenses?: Record<string, number>;
	categoryColors?: Record<string, string>;
};

const screenWidth = Dimensions.get("window").width;
const CHART_RADIUS = 120; // Augmentation du rayon pour lisibilité

export default function Graph({
	                              revenus = {},
	                              depenses = {},
	                              categoryColors = {},
                              }: GraphProps) {
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

	const renderPieChart = (data: typeof incomeData, title: string) => (
		<View style={[styles.graphWrapper, { width: screenWidth * 0.9 }]}>
			<Text style={styles.title}>{title}</Text>
			{data.length > 0 ? (
				<View style={styles.chartContainer}>
					<PieChart
						donut
						data={data}
						radius={CHART_RADIUS}
						innerRadius={CHART_RADIUS * 0.6}
						showText
						textColor="black"
						textSize={12}
						centerLabelComponent={() => (
							<Text style={styles.centerText}>
								{formatValue(data.reduce((s, v) => s + v.value, 0))}
							</Text>
						)}
					/>

					<View style={styles.legendContainer}>
						{data.map((entry) => (
							<View key={entry.name} style={styles.legendItem}>
								<View
									style={[styles.legendDot, { backgroundColor: entry.color }]}
								/>
								<Text style={styles.legendText}>
									{entry.name} ({formatValue(entry.value)})
								</Text>
							</View>
						))}
					</View>
				</View>
			) : (
				<Text style={styles.emptyText}>
					Aucune donnée pour {title.toLowerCase()}
				</Text>
			)}
		</View>
	);

	return (
		<ScrollView
			horizontal
			pagingEnabled
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.scrollContainer}
			bounces={false} // empêche l’effet élastique horizontal
		>
			{renderPieChart(incomeData, "Revenus par source")}
			{renderPieChart(expenseData, "Dépenses par catégorie")}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scrollContainer: {
		alignItems: "center",
		paddingHorizontal: 8,
		paddingBottom: 20,
	},
	graphWrapper: {
		marginHorizontal: 8,
		padding: 15,
		backgroundColor: "#fff",
		borderRadius: 12,
		elevation: 4,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		minHeight: 350,
		justifyContent: "center",
	},
	title: {
		textAlign: "center",
		fontWeight: "bold",
		fontSize: 18,
		marginBottom: 15,
	},
	chartContainer: {
		flexDirection: "column",
		alignItems: "center",
	},
	centerText: {
		fontWeight: "bold",
		fontSize: 16,
		color: "#333",
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
		color: "#555",
		flexShrink: 1,
	},
	emptyText: {
		textAlign: "center",
		color: "#888",
		paddingVertical: 40,
	},
});