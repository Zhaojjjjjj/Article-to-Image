/**
 * Prompt Generator: Assembles the final prompt for the image model
 */
async function generatePrompt(visualPlan, semanticData) {
	console.log("Generating prompt...");

	// Prompt Engineering Template
	const magicWords = "high quality, 8k, masterpiece, trending on artstation, highly detailed";

	const subject = visualPlan.subject;
	const description = semanticData.summary.substring(0, 50);
	const style = visualPlan.style;
	const lighting = visualPlan.lighting;

	const prompt = `${subject}, ${description}. Style: ${style}. Lighting: ${lighting}. ${visualPlan.composition}. ${magicWords}`;

	return {
		prompt: prompt,
		negativePrompt: "text, watermark, ugly, deformed, blurry, bad anatomy",
	};
}

module.exports = { generatePrompt };
