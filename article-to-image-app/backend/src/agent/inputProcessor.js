const axios = require("axios");
const cheerio = require("cheerio");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const fs = require("fs");

/**
 * Input Layer: Normalizes input into a standard text format
 */
async function processInput(type, data) {
	try {
		if (type === "text") {
			return cleanText(data);
		}

		if (type === "url") {
			const response = await axios.get(data);
			const $ = cheerio.load(response.data);
			// Remove scripts, styles, etc.
			$("script").remove();
			$("style").remove();
			return cleanText($("body").text());
		}

		if (type === "file") {
			const { mimetype, path } = data;
			const buffer = fs.readFileSync(path);

			if (mimetype === "application/pdf") {
				const result = await pdf(buffer);
				return cleanText(result.text);
			} else if (mimetype.includes("wordprocessingml")) {
				const result = await mammoth.extractRawText({ buffer });
				return cleanText(result.value);
			} else {
				return cleanText(buffer.toString("utf8"));
			}
		}

		throw new Error("Unsupported input type");
	} catch (error) {
		console.error("Input Processing Error:", error);
		throw new Error("Failed to process input content");
	}
}

function cleanText(text) {
	return text.replace(/\s+/g, " ").trim().substring(0, 5000); // Limit context window
}

module.exports = { processInput };
