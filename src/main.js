import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import "./assets/main.css";
import App from "./App.vue";
import en from "./locales/en";
import zh from "./locales/zh";

const i18n = createI18n({
	legacy: false, // Use Composition API
	locale: "zh", // Default to Chinese as per request context
	fallbackLocale: "en",
	messages: {
		en,
		zh,
	},
});

const app = createApp(App);
app.use(i18n);
app.mount("#app");
