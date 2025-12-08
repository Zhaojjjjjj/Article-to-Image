const { processInput } = require("./inputProcessor");
const { analyzeSemantics } = require("./semanticEngine");
const { planVisuals } = require("./visualPlanner");
const { generatePrompt } = require("./promptGenerator");
const { generateImages } = require("./imageGenerator");
const { evaluateImages } = require("./clipEvaluator");

async function runAgentFlow({ type, data, userPreferences }) {
	console.log("🚀 Starting Agent Flow...");
	const steps = [];

	// 1. Input Processing
	const cleanText = await processInput(type, data);
	steps.push({ step: "Input Processing", output: "Text extracted successfully" });

	// 2. Semantic Understanding
	if (typeof analyzeSemantics !== "function") {
		throw new Error("Critical Error: analyzeSemantics is not a function. Check semanticEngine.js export.");
	}

	const semanticData = await analyzeSemantics(cleanText);
	steps.push({ step: "Semantic Analysis", output: semanticData });

	// 3. Visual Planning
	const visualPlan = await planVisuals(semanticData, userPreferences);
	steps.push({ step: "Visual Planning", output: visualPlan });

	// 4. Prompt Generation
	// If Qwen gave us specific prompts, we might want to use them, but for now we stick to the pipeline flow
	// or merge them.
	let promptData;
	if (semanticData.illustrations && semanticData.illustrations.length > 0) {
		// Use the prompt from the LLM if available
		promptData = {
			prompt: semanticData.illustrations[0].prompt,
			negativePrompt: "text, watermark, ugly",
		};
	} else {
		promptData = await generatePrompt(visualPlan, semanticData);
	}

	steps.push({ step: "Prompt Generation", output: promptData });

	// 5. Image Generation
	const rawImages = await generateImages(promptData, 4);
	steps.push({ step: "Image Generation", output: `${rawImages.length} images generated` });

	// 6. CLIP Evaluation
	const rankedImages = await evaluateImages(rawImages, promptData.prompt);
	steps.push({ step: "CLIP Evaluation", output: "Images ranked" });

	return {
		result: {
			prompt: promptData.prompt,
			images: rankedImages,
			visualPlan: visualPlan,
		},
		trace: steps,
	};
}

module.exports = { runAgentFlow };
