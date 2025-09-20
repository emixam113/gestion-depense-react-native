import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { Expense } from "../(app)/Types";

type Props = {
    expenses: Expense[];
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
};

export default function ExpenseList({ expenses, onEdit, onDelete }: Props) {
    return (
        <FlatList
            data={expenses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <View className="bg-white rounded-lg p-4 mb-3 flex-row justify-between">
                    {/* Infos dépense */}
                    <View>
                        <Text className="font-bold text-lg">{item.title}</Text>
                        <Text className="text-gray-500">{item.date}</Text>
                    </View>

                    {/* Montant + actions */}
                    <View className="items-end">
                        <Text
                            className={`font-bold ${
                                item.type === "depense" ? "text-red-500" : "text-green-500"
                            }`}
                        >
                            {item.amount} €
                        </Text>
                        <View className="flex-row space-x-4 mt-1">
                            <TouchableOpacity onPress={() => onEdit(item.id)}>
                                <Text className="text-blue-500">Modifier</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => onDelete(item.id)}>
                                <Text className="text-red-500">Supprimer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        />
    );
}
