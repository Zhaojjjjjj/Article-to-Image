const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const { runAgentFlow } = require("../agent/agentFlow");
const { processInput } = require("../agent/inputProcessor");

// In-memory store (Replace with DB in prod)
let history = [];

/**
 * @route POST /api/extract
 * @desc Parse input and return preview text
 */
router.post("/extract", upload.single("file"), async (req, res) => {
	try {
		const { type, url, text } = req.body;
		let data = text;
		if (type === "url") data = url;
		if (type === "file") data = req.file;

		const extractedText = await processInput(type, data);
		res.json({ success: true, text: extractedText });
	} catch (error) {
		res.status(500).json({ success: false, error: error.message });
	}
});

/**
 * @route POST /api/generate
 * @desc Run the full Agent pipeline
 */
router.post("/generate", async (req, res) => {
	try {
		const { type, data, preferences } = req.body; // data can be text or already extracted text

		const result = await runAgentFlow({ type, data, userPreferences: preferences });

		// Save to history
		const historyItem = {
			id: Date.now().toString(),
			timestamp: new Date(),
			...result.result,
		};
		history.unshift(historyItem);

		res.json({ success: true, data: result });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: error.message });
	}
});

/**
 * @route GET /api/history
 * @desc Get generated history
 */
router.get("/history", (req, res) => {
	res.json(history);
});

module.exports = router;
