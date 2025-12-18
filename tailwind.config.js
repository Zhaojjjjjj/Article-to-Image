/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				background: "#0a0a0f",
				foreground: "#e0e0e0",
				card: "#12121a",
				muted: "#1c1c2e",
				"muted-foreground": "#6b7280",
				accent: "#00ff88",
				"accent-secondary": "#ff00ff",
				"accent-tertiary": "#00d4ff",
				border: "#2a2a3a",
				input: "#12121a",
				destructive: "#ff3366",
			},
			fontFamily: {
				sans: ["Orbitron", "sans-serif"],
				mono: ["JetBrains Mono", "monospace"],
				tech: ["Share Tech Mono", "monospace"],
			},
			boxShadow: {
				neon: "0 0 5px #00ff88, 0 0 10px #00ff8840",
				"neon-sm": "0 0 3px #00ff88, 0 0 6px #00ff8830",
				"neon-lg": "0 0 10px #00ff88, 0 0 20px #00ff8860, 0 0 40px #00ff8830",
				"neon-secondary": "0 0 5px #ff00ff, 0 0 20px #ff00ff60",
			},
			animation: {
				glitch: "glitch 1s linear infinite",
				blink: "blink 1s step-end infinite",
				"pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
			},
			keyframes: {
				glitch: {
					"2%, 64%": { transform: "translate(2px,0) skew(0deg)" },
					"4%, 60%": { transform: "translate(-2px,0) skew(0deg)" },
					"62%": { transform: "translate(0,0) skew(5deg)" },
				},
				blink: {
					"50%": { opacity: "0" },
				},
			},
		},
	},
	plugins: [],
};
