import React, { useState } from "react";
import {
	View,
	Text,
	TextInput,
	StyleSheet,
	TouchableOpacity,
	Alert
} from "react-native";
// Ensure the path is correct for your TypeScript types
import { Category } from '../Types/category';

interface Props {
	token: string | null;
	onCategoryAdded?: (category: Category) => void;
}

// Use a constant for the API base URL
const BASE_API_URL = "http://192.168.1.39:3000";

const AddCategory: React.FC<Props> = ({ token, onCategoryAdded }) => {
	// State variable names are now in English
	const [name, setName] = useState("");
	const [color, setColor] = useState("#34D399");

	const handleSubmit = async () => {
		if (!token) {
			Alert.alert("Authentication Error", "Please log in to add a category.");
			return;
		}
		if (!name.trim()) {
			Alert.alert("Input Error", "Category name is required.");
			return;
		}

		// Basic HEX color validation
		if (!/^#([0-9A-Fa-f]{3}){1,2}$/.test(color)) {
			Alert.alert("Color Error", "Please enter a valid HEX color code (e.g., #RRGGBB).");
			return;
		}

		try {
			const res = await fetch(`${BASE_API_URL}/categories`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				// Request body keys are consistent with the backend model
				body: JSON.stringify({ name, color }),
			});

			if (res.status === 401) {
				throw new Error("Access denied. Token is invalid or expired.");
			}
			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || "Error adding the category.");
			}

			const newCategory: Category = await res.json();

			// Success logic
			setName("");
			setColor("#34D399");
			Alert.alert("Success", `Category '${newCategory.name}' has been added.`);

			// Callback execution
			onCategoryAdded?.(newCategory);

		} catch (err) {
			console.error("Add category error:", err);
			Alert.alert("API Error", err instanceof Error ? err.message : "An unknown error occurred.");
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.heading}>Add Category</Text>

			<View style={styles.inputGroup}>

				{/* 1. Category Name Input */}
				<TextInput
					style={[styles.input, styles.nameInput]}
					placeholder="Category Name"
					value={name}
					onChangeText={setName}
					autoCapitalize="words"
				/>

				{/* 2. Color Input and Preview */}
				<View style={styles.colorWrapper}>
					<View style={[styles.colorPreview, { backgroundColor: color }]} />

					<TextInput
						style={styles.colorInput}
						placeholder="#HEX Code"
						value={color}
						onChangeText={setColor}
						maxLength={7}
						autoCapitalize="none"
					/>
				</View>

				{/* 3. Submit Button */}
				<TouchableOpacity
					style={styles.button}
					onPress={handleSubmit}
				>
					<Text style={styles.buttonText}>Add</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default AddCategory;


// --- React Native Styles ---
const styles = StyleSheet.create({
	container: {
		padding: 16,
		backgroundColor: '#f9f9f9',
		borderRadius: 8,
		marginVertical: 10,
	},
	heading: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 12,
		color: '#333',
	},
	inputGroup: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	input: {
		borderWidth: 1,
		borderColor: '#ccc',
		padding: 10,
		borderRadius: 6,
		fontSize: 16,
	},
	nameInput: {
		flex: 1,
	},
	colorWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 6,
		paddingRight: 5,
	},
	colorPreview: {
		width: 30,
		height: 30,
		borderRadius: 4,
		margin: 5,
		borderWidth: 1,
		borderColor: '#eee',
	},
	colorInput: {
		width: 80,
		padding: 10,
		fontSize: 16,
		borderWidth: 0,
	},
	button: {
		backgroundColor: '#10B981',
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 6,
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonText: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 16,
	},
});