import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue()],
	server: {
		proxy: {
			"/api/aliyun": {
				target: "https://dashscope.aliyuncs.com",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api\/aliyun/, ""),
			},
		},
	},
});
