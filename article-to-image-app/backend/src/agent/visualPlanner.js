/**
 * Visual Planner: Decides on the artistic direction
 */
async function planVisuals(semanticData, userPreferences = {}) {
	console.log("Planning visuals...");

	// Map sentiment/keywords to visual styles
	let style = userPreferences.style || "Cinematic";
	let tone = semanticData.sentiment === "positive" ? "Bright, Vibrant" : "Moody, Muted";

	if (semanticData.keywords.includes("tech")) style = "Cyberpunk";
	if (semanticData.keywords.includes("nature")) style = "Watercolor";

	return {
		style: style,
		composition: "Wide angle, Rule of thirds",
		lighting: tone,
		colorPalette: semanticData.sentiment === "positive" ? ["Blue", "Gold"] : ["Grey", "Dark Blue"],
		subject: semanticData.keywords[0] || "Abstract Concept",
	};
}

module.exports = { planVisuals };
