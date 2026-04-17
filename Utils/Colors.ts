//couleur par défaut:
export const FALLBACK_COLORS : string[] = [
	"#00C49F", // Vert vif
	"#0088FE", // Bleu
	"#FFBB28", // Jaune/Orange
	"#FF8042", // Orange
	"#AA66CC", // Violet
	"#2ECC71", // Émeraude
	"#F39C12", // Orange foncé
	"#D35400", // Carotte
	"#C0392B", // Rouge brique
];

//couleur fixe pour la catégorie "Autre"
export const OTHER_CATEGORY_COLORS = "#5C5C5C";


//map couleur statique :
export const STATIC_CATEGORY_COLORS_MAP: Record<string, string> = {
	"Revenue": "#28A745",
	"Abonnement": "#8E44AD",
	"Loyer": "#3498D8",
	"Alimentation": "#E74C3C",
}

//Fonction utilitaire centrale
export function getCategoryColor(
	categoryName: string,
	apiColor?: string,
	index = 0
): string {

	// Priorité 1 : couleur provenant de l'API
	if (apiColor && typeof apiColor === "string") {
		return apiColor;
	}

	// Priorité 2 : couleur statique prédéfinie
	const staticColor = STATIC_CATEGORY_COLORS_MAP[categoryName];
	if (staticColor) {
		return staticColor;
	}

	// Priorité 3 : catégorie "Autres"
	if (categoryName === "Autres") {
		return OTHER_CATEGORY_COLORS;
	}

	// Priorité 4 : fallback basé sur l'index
	return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}