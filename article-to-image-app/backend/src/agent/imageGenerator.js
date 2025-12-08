/**
 * Image Generator: Calls the Image Gen API
 * Supports Alibaba Cloud (Wanx) with Async Polling
 */
const axios = require("axios");
require("dotenv").config();

async function generateImages(promptData, count = 4) {
	console.log(`Generating images for prompt: ${promptData.prompt.substring(0, 20)}...`);

	if (process.env.DASHSCOPE_API_KEY) {
		return await callAlibabaWanx(promptData.prompt, count);
	}

	console.log("No API Key found, using mocks.");
	return mockImages(count);
}

async function callAlibabaWanx(prompt, count) {
	try {
		console.log("Calling Alibaba Wanx (Text-to-Image)...");

		const response = await axios.post(
			"https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis",
			{
				model: "wanx-v1",
				input: {
					prompt: prompt,
				},
				parameters: {
					style: "<auto>",
					size: "1024*1024",
					n: count,
				},
			},
			{
				headers: {
					"X-DashScope-Async": "enable",
					Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
					"Content-Type": "application/json",
				},
			}
		);

		if (response.data.output && response.data.output.task_id) {
			const taskId = response.data.output.task_id;
			console.log(`Wanx task started: ${taskId}. Waiting for results...`);

			// Poll for results
			const results = await pollTask(taskId);
			if (results) {
				console.log("Wanx generation successful!");
				return results;
			}
		}

		console.warn("Wanx returned no task ID or failed polling, falling back to mocks.");
		return mockImages(count);
	} catch (error) {
		console.error("Alibaba Wanx Error:", error.response ? error.response.data : error.message);
		return mockImages(count);
	}
}

async function pollTask(taskId) {
	const maxRetries = 30; // Wait up to 60 seconds (30 * 2s)
	const delay = 2000;

	for (let i = 0; i < maxRetries; i++) {
		try {
			await new Promise((resolve) => setTimeout(resolve, delay));

			const response = await axios.get(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
				headers: {
					Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
				},
			});

			const status = response.data.output.task_status;
			console.log(`Polling task ${taskId}: ${status}`);

			if (status === "SUCCEEDED") {
				// Wanx returns results in output.results
				// Each result has a 'url'
				if (response.data.output.results) {
					return response.data.output.results.map((r) => r.url);
				}
			} else if (status === "FAILED" || status === "CANCELED") {
				console.error("Task failed:", response.data.output.message);
				return null;
			}
			// If RUNNING or PENDING, continue loop
		} catch (error) {
			console.error("Polling error:", error.message);
			// Continue polling even if one request fails, unless critical
		}
	}

	console.error("Polling timed out.");
	return null;
}

function mockImages(count) {
	const mocks = [
		"https://images.unsplash.com/photo-1699004186431-e20f5540644f?w=800&auto=format&fit=crop&q=60",
		"https://images.unsplash.com/photo-1699477166539-1959939c55a4?w=800&auto=format&fit=crop&q=60",
		"https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&auto=format&fit=crop&q=60",
		"https://images.unsplash.com/photo-1682685797661-9e0c8c18e187?w=800&auto=format&fit=crop&q=60",
	];
	return mocks.slice(0, count);
}

module.exports = { generateImages };
