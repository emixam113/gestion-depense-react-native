import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { useAccessibility } from "../Context/Accessibility";

interface AccessibilityToggleProps {
	showLabel?: boolean;
}

export default function AccessibilityToggle({ showLabel = true }: AccessibilityToggleProps) {
	const { accessibleFont, toggleFont, isLoading } = useAccessibility();

	if (isLoading) {
		return null; // Ou un loader si vous préférez
	}

	return (
		<View style={styles.container}>
			{showLabel && (
				<View style={styles.labelContainer}>
					<Text style={styles.label}>👁️ Police accessible</Text>
					<Text style={styles.sublabel}>
						{accessibleFont ? "Activée (Atkinson Hyperlegible)" : "Désactivée (Police par défaut)"}
					</Text>
				</View>
			)}

			<Switch
				value={accessibleFont}
				onValueChange={toggleFont}
				trackColor={{ false: "#D1D5DB", true: "#28A745" }}
				thumbColor={accessibleFont ? "#FFF" : "#F3F4F6"}
				ios_backgroundColor="#D1D5DB"
			/>
		</View>
	);
}


const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 5,
		paddingHorizontal: 16,
		backgroundColor: "#FFF",
		borderRadius: 5,
		marginVertical: 5,
	},
	labelContainer: {
		flex: 1,
		marginBottom: 12,
	},
	label: {
		fontSize: 16,
		fontWeight: "600",
		color: "#333",
		marginBottom: 2,
	},
	subLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: "#333",
		marginBottom: 2,
	},
	sublabel: {
		fontSize: 12,
		color: "#666",
	},
});