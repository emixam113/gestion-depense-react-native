import React from "react";
import { View, Text } from "react-native";
import { PieChart } from "react-native-gifted-charts";

export default function Graph() {
    const data = [
        { value: 50, color: "#4CAF50", text: "Courses" },
        { value: 30, color: "#2196F3", text: "Loisirs" },
        { value: 20, color: "#FF9800", text: "Transport" },
    ];

    return (
        <View>
            <Text style={{ textAlign: "center", fontWeight: "bold", marginBottom: 10 }}>
                💸 Dépenses par catégorie
            </Text>
            <PieChart
                donut
                data={data}
                radius={120}
                innerRadius={60}
                showText
                textColor="black"
                textSize={12}
            />
        </View>
    );
}
