/**
 * Semantic Engine: Analyzes text for key visual elements
 * Supports OpenAI and Alibaba Cloud (DashScope/Qwen)
 */
const axios = require("axios");
require("dotenv").config();

async function analyzeSemantics(text) {
	console.log("Analyzing semantics...");

	// 1. Alibaba DashScope (Qwen) Implementation
	if (process.env.DASHSCOPE_API_KEY) {
		return await callAlibabaLLM(text);
	}

	// 2. Fallback Mock Implementation
	return mockAnalysis(text);
}

async function callAlibabaLLM(text) {
	try {
		console.log("Calling Alibaba Qwen-Turbo...");

		// ==========================================
		// 📝 SYSTEM PROMPT IS HERE
		// ==========================================
		const systemPrompt = `
# Role
你是一位拥有20年经验的顶级杂志美术总监和AI绘画提示词专家。你的核心能力是将枯燥的文本转化为极具视觉冲击力、富有隐喻深意且风格统一的画面描述。

# Objective
接收用户输入的文章片段或全文，深入分析其核心主题、情感基调和关键信息，构思出 1-3 幅（根据文本长度决定）最适合该文章的配图方案，并输出为标准的 AI 绘画提示词。

# Workflow (必须严格遵守)
1. **深度语义分析**：
   - 分析文章类型（科技/情感/新闻/小说/商业）。
   - 提取情感关键词（如：焦虑、希望、冷酷、温暖）。
   - 识别核心实体（人物、物体、场景）。

2. **视觉转化 (Visual Translation)**：
   - **具象化抽象概念**：如果文章提到“思维受阻”，不要直接画一个人在思考，要转化为“一个人面对着一堵巨大的、由杂乱电线构成的迷宫高墙”。
   - **风格定义**：根据文章类型锁定一种艺术风格（如：Tech article -> Isometric 3D rendering; Emotional story -> Watercolor illustration）。

3. **Prompt 构建 (Prompt Engineering)**：
   - 使用结构化公式：[主体(Subject) + 动作/状态(Action)] + [环境/背景(Environment)] + [构图/视角(Composition)] + [艺术风格(Art Style)] + [光影/色调(Lighting/Color)] + [质量修饰词(Tags)]。
   - **提示词必须使用英文 (English)**，以确保主流生图模型的最佳兼容性。

# Output Format (JSON)
请仅输出一个 JSON 格式的数据，不要包含任何多余的寒暄。格式如下：
{
  "article_tone": "文章基调 (如：严肃科技感)",
  "suggested_art_style": "建议风格 (如：Cyberpunk digital art)",
  "illustrations": [
    {
      "id": 1,
      "rationale": "中文设计思路：解释为什么要画这个画面，以及它对应文章的哪部分内容。",
      "visual_metaphor": "视觉隐喻：说明使用了什么具象元素来表达抽象概念（如有）。",
      "prompt": "English Prompt string here..."
    }
  ]
}

# Constraints
- 如果文章很短，生成1张图；如果较长，生成2-3张。
- 保持所有生成的图片在 Art Style 上的一致性。
- Prompt 中必须包含高画质修饰词（如：8k resolution, cinematic lighting, highly detailed, masterpiece）。
`;

		const response = await axios.post(
			"https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
			{
				model: "qwen-turbo",
				input: {
					messages: [
						{ role: "system", content: systemPrompt },
						{ role: "user", content: text },
					],
				},
				parameters: {
					result_format: "message",
				},
			},
			{
				headers: {
					Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
					"Content-Type": "application/json",
				},
			}
		);

		const content = response.data.output.choices[0].message.content;

		// Attempt to parse JSON from the response if possible
		// Since the prompt asks for JSON, Qwen usually returns it wrapped in markdown ```json ... ```
		// We need a simple parser here to be robust.
		let parsedContent = {};
		try {
			const jsonMatch = content.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				parsedContent = JSON.parse(jsonMatch[0]);
			}
		} catch (e) {
			console.log("Failed to parse JSON from Qwen:", e);
		}

		return {
			summary: parsedContent.article_tone || content.substring(0, 100),
			keywords: ["AI", "Qwen", "Generated"],
			sentiment: "positive",
			coreMessage: content,
			rawOutput: content,
			illustrations: parsedContent.illustrations, // Pass this along if we want to use it later
		};
	} catch (error) {
		console.error("Alibaba API Error:", error.response ? error.response.data : error.message);
		return mockAnalysis(text);
	}
}

function mockAnalysis(text) {
	const keywords = text
		.split(" ")
		.filter((w) => w.length > 5)
		.slice(0, 5);
	const sentiment = text.includes("good") || text.includes("success") ? "positive" : "neutral";

	return {
		summary: text.substring(0, 100) + "...",
		keywords: keywords,
		sentiment: sentiment,
		entities: ["Person", "Landscape"],
		coreMessage: "The essence of the article described visually.",
	};
}

module.exports = { analyzeSemantics };
