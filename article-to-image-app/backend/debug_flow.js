const { runAgentFlow } = require("./src/agent/agentFlow");

async function test() {
	try {
		await runAgentFlow({ type: "text", data: "test", userPreferences: {} });
	} catch (e) {
		console.error(e);
	}
}

test();
