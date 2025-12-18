<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import gsap from "gsap";
import CyberButton from "./components/ui/CyberButton.vue";
import CyberInput from "./components/ui/CyberInput.vue";
import CyberSelect from "./components/ui/CyberSelect.vue";
import CyberCard from "./components/ui/CyberCard.vue";

const { t, locale } = useI18n();

// --- State ---
const articleTitle = ref("");
const articleText = ref("");
const stylePreset = ref("cyberpunk");
const aspectRatio = ref("1664*928");
const isLoading = ref(false);
const imageUrl = ref("");
const usedPrompt = ref("");
const errorMessage = ref("");
const history = ref([]);
const showHistory = ref(false);

const previewSection = ref(null);

// --- Configuration ---
const styles = computed(() => [
	{ id: "cyberpunk", name: t("styles.cyberpunk"), promptEx: "cyberpunk, night city, rain, neon signs, highly detailed, cinematic lighting" },
	{ id: "education", name: t("styles.education"), promptEx: "clean minimal flat illustration, modern classroom, students and teacher, soft colors" },
	{ id: "tech", name: t("styles.tech"), promptEx: "futuristic, neon lights, digital interface, high tech, cyan and purple color scheme, 3d render" },
	{ id: "finance", name: t("styles.finance"), promptEx: "business people, charts, city skyline, professional, corporate blue, isometric" },
	{ id: "kids", name: t("styles.kids"), promptEx: "cute, colorful, lovely cartoon style, friendly characters, soft lighting, watercolor" },
	{ id: "nature", name: t("styles.nature"), promptEx: "beautiful landscape, mountains, forest, river, photorealistic, 8k, national geographic" },
]);

const ratios = computed(() => [
	{ id: "1664*928", label: t("ratios.landscape") + " (16:9)", value: "1664*928" },
	{ id: "1328*1328", label: t("ratios.square") + " (1:1)", value: "1328*1328" },
	{ id: "928*1664", label: t("ratios.portrait") + " (9:16)", value: "928*1664" },
]);

// --- Lifecycle ---
onMounted(() => {
	const saved = localStorage.getItem("img_history");
	if (saved) history.value = JSON.parse(saved);
});

function toggleLanguage() {
	locale.value = locale.value === "zh" ? "en" : "zh";
}

// --- Logic (Unchanged) ---
function buildImagePrompt(text, title, styleId, ratioId) {
	const selectedStyle = styles.value.find((s) => s.id === styleId);
	const stylePrompt = selectedStyle ? selectedStyle.promptEx : "";
	const contentSnippet = text.trim().slice(0, 150).replace(/\n/g, " ");
	const titlePart = title ? `Subject: ${title}. ` : "";
	const contentPart = `Context: ${contentSnippet}...`;
	const ratioKeywords = ratioId === "1328*1328" ? "square composition" : ratioId === "928*1664" ? "portrait vertical" : "cinematic widescreen";
	return `${stylePrompt}. ${titlePart}${contentPart}. ${ratioKeywords}, High quality, 8k, detailed.`;
}

const ALIYUN_API_KEY = import.meta.env.VITE_ALIYUN_API_KEY;
const ALIYUN_API_ENDPOINT = "/api/aliyun/api/v1/services/aigc/multimodal-generation/generation";

async function generateImage(prompt, size) {
	if (!ALIYUN_API_KEY) throw new Error("Missing API Key.");

	const response = await fetch(ALIYUN_API_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${ALIYUN_API_KEY}`,
		},
		body: JSON.stringify({
			model: "qwen-image-plus",
			input: {
				messages: [{ role: "user", content: [{ text: prompt }] }],
			},
			parameters: { size: size, n: 1 },
		}),
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err.message || `API Error: ${response.status}`);
	}

	const data = await response.json();

	if (data.output && data.output.choices) {
		const content = data.output.choices[0].message.content;
		const imgItem = content.find((item) => item.image || item.img);
		if (imgItem) return imgItem.image || imgItem.img;
	}
	if (data.output && data.output.results && data.output.results[0]) {
		return data.output.results[0].url;
	}
	if (data.output && data.output.task_id) {
		return await pollTask(data.output.task_id);
	}
	throw new Error("Unknown response format.");
}

async function pollTask(taskId) {
	const maxRetries = 20;
	const delay = 3000;
	for (let i = 0; i < maxRetries; i++) {
		await new Promise((r) => setTimeout(r, delay));
		const resp = await fetch(`/api/aliyun/api/v1/tasks/${taskId}`, {
			headers: { Authorization: `Bearer ${ALIYUN_API_KEY}` },
		});
		const data = await resp.json();
		if (data.output && data.output.task_status === "SUCCEEDED") {
			if (data.output.results && data.output.results[0]) return data.output.results[0].url;
			return data.output.results[0].url;
		} else if (data.output && data.output.task_status === "FAILED") {
			throw new Error(`Task failed: ${data.output.message}`);
		}
	}
	throw new Error("Task timed out.");
}

async function handleGenerate() {
	if (!articleText.value) return;
	isLoading.value = true;
	errorMessage.value = "";
	imageUrl.value = "";

	if (previewSection.value) {
		gsap.to(previewSection.value, { opacity: 0.5, duration: 0.5, ease: "power2.inOut" });
	}

	try {
		const prompt = buildImagePrompt(articleText.value, articleTitle.value, stylePreset.value, aspectRatio.value);
		usedPrompt.value = prompt;
		const url = await generateImage(prompt, aspectRatio.value);
		imageUrl.value = url;
		addToHistory(url, prompt, stylePreset.value);
	} catch (error) {
		console.error(error);
		errorMessage.value = error.message;
	} finally {
		isLoading.value = false;
		if (previewSection.value) {
			gsap.to(previewSection.value, { opacity: 1, duration: 0.5, ease: "power2.inOut" });
		}
	}
}

function addToHistory(url, prompt, style) {
	history.value.unshift({ id: Date.now(), url, prompt, styleId: style, date: new Date().toLocaleString() });
	if (history.value.length > 20) history.value.pop();
}
watch(history, (v) => localStorage.setItem("img_history", JSON.stringify(v)), { deep: true });

function restoreFromHistory(item) {
	imageUrl.value = item.url;
	usedPrompt.value = item.prompt;
	stylePreset.value = item.styleId || "cyberpunk";
}

function downloadImage(url) {
	window.open(url, "_blank");
}
async function copyPrompt() {
	await navigator.clipboard.writeText(usedPrompt.value);
}

const isGenerateDisabled = computed(() => !articleText.value.trim() || isLoading.value);

// Helper for select options
const styleOptions = computed(() => styles.value.map((s) => ({ value: s.id, label: s.name })));
const ratioOptions = computed(() => ratios.value.map((r) => ({ value: r.value, label: r.label })));
</script>

<template>
	<div class="min-h-screen p-4 md:p-8 pb-32 bg-transparent text-foreground font-mono selection:bg-accent selection:text-background">
		<!-- Header -->
		<header class="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row justify-between items-end border-b border-border pb-6 relative group">
			<div class="flex flex-col gap-2">
				<div class="flex items-center gap-4">
					<div class="w-2 h-12 bg-accent animate-pulse"></div>
					<h1 class="text-4xl md:text-7xl font-sans font-black uppercase tracking-widest cyber-glitch" data-text="ARTICLE_TO_IMAGE">ARTICLE<br class="md:hidden" />_TO_IMAGE</h1>
				</div>
				<p class="text-accent/60 font-mono text-sm tracking-[0.3em] uppercase pl-6">> SYSTEM_READY</p>
			</div>

			<div class="flex gap-4 mt-6 md:mt-0">
				<CyberButton variant="outline" @click="toggleLanguage">
					{{ locale === "zh" ? "EN" : "CHN" }}
				</CyberButton>
				<CyberButton variant="outline" class="lg:hidden" @click="showHistory = !showHistory"> LOGS </CyberButton>
			</div>

			<!-- Decorative corner -->
			<div class="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-accent"></div>
		</header>

		<!-- Main Layout -->
		<main class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
			<!-- Controls Column -->
			<div class="lg:col-span-4 flex flex-col gap-8 sticky top-8">
				<CyberCard variant="terminal">
					<h2 class="text-xl font-bold uppercase mb-6 flex items-center gap-2 text-accent tracking-widest">
						<span class="animate-blink">></span>
						{{ t("config") || "CONFIGURATION" }}
					</h2>

					<div class="space-y-6">
						<CyberInput v-model="articleTitle" :label="t('articleTitle') || 'SUBJECT_ID'" :placeholder="t('articleTitlePlaceholder') || 'Enter subject...'" />

						<div class="flex flex-col gap-1 w-full font-mono">
							<label class="text-xs uppercase tracking-[0.2em] text-accent/80 pl-1 mb-1">{{ t("articleContent") || "DATA_STREAM" }}</label>
							<div class="relative group">
								<div class="absolute left-3 top-4 text-accent font-bold select-none group-focus-within:animate-pulse">></div>
								<textarea v-model="articleText" rows="6" :placeholder="t('articleContentPlaceholder') || 'Input text data...'" class="w-full bg-input border border-border cyber-chamfer-sm pl-8 pr-4 py-3 text-accent placeholder-muted-foreground focus:outline-none focus:border-accent focus:shadow-neon transition-all font-mono resize-none text-sm leading-relaxed"></textarea>
							</div>
						</div>

						<div class="grid grid-cols-1 gap-4">
							<CyberSelect v-model="stylePreset" :options="styleOptions" :label="t('style') || 'RENDER_STYLE'" />
							<CyberSelect v-model="aspectRatio" :options="ratioOptions" :label="t('ratio') || 'DIMENSIONS'" />
						</div>

						<div class="pt-6">
							<CyberButton variant="glitch" class="w-full text-xl py-6 font-black" @click="handleGenerate" :disabled="isGenerateDisabled">
								<span v-if="isLoading" class="animate-pulse">PROCESSING...</span>
								<span v-else>INITIALIZE_RENDER</span>
							</CyberButton>
						</div>
					</div>
				</CyberCard>

				<!-- History (Desktop) -->
				<div class="hidden lg:block relative">
					<!-- Decorative header line -->
					<div class="flex items-center gap-2 mb-4">
						<div class="w-2 h-2 bg-accent rounded-full animate-ping"></div>
						<h3 class="font-bold uppercase tracking-widest text-sm text-foreground/70">SYSTEM_LOGS</h3>
						<div class="flex-1 h-px bg-border"></div>
					</div>

					<div class="space-y-2">
						<div v-for="(item, i) in history.slice(0, 5)" :key="item.id" @click="restoreFromHistory(item)" class="group flex items-center gap-3 cursor-pointer p-2 transition-all border border-transparent hover:border-accent/30 hover:bg-input cyber-chamfer-sm" :style="{ animationDelay: `${i * 100}ms` }">
							<div class="relative w-12 h-12 flex-shrink-0 border border-border group-hover:border-accent overflow-hidden">
								<img :src="item.url" class="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
							</div>
							<div class="flex-1 min-w-0 font-mono">
								<p class="text-[10px] text-accent truncate group-hover:text-accent-tertiary transition-colors">>> {{ item.prompt }}</p>
								<p class="text-[9px] text-muted-foreground">{{ item.date }}</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Result Column -->
			<div class="lg:col-span-8 flex flex-col h-full min-h-[600px] relative" ref="previewSection">
				<CyberCard variant="holographic" class="flex-1 flex flex-col items-center justify-center min-h-[600px] relative overflow-hidden">
					<!-- HUD Decoration -->
					<div class="absolute top-4 left-4 text-[10px] text-accent/40 font-mono tracking-widest pointer-events-none">
						COORD: 45.912, -12.004<br />
						STATUS: {{ isLoading ? "RENDERING" : imageUrl ? "COMPLETE" : "STANDBY" }}
					</div>

					<!-- Loading State -->
					<div v-if="isLoading" class="flex flex-col items-center justify-center z-20">
						<div class="relative w-24 h-24 mb-8">
							<div class="absolute inset-0 border-4 border-accent/30 rounded-full animate-ping"></div>
							<div class="absolute inset-0 border-t-4 border-accent rounded-full animate-spin"></div>
						</div>
						<h3 class="text-2xl font-black uppercase tracking-widest text-accent cyber-glitch" data-text="GENERATING_DATA">GENERATING_DATA</h3>
						<p class="mt-2 text-xs font-mono text-accent/70 animate-pulse">DO NOT DISCONNECT...</p>
					</div>

					<!-- Empty State -->
					<div v-if="!imageUrl && !isLoading" class="text-center opacity-30 max-w-md">
						<svg class="w-32 h-32 mx-auto mb-6 text-accent animate-pulse-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="square" stroke-linejoin="miter" stroke-width="0.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
						</svg>
						<p class="text-xl font-bold uppercase tracking-[0.2em] font-mono">AWAITING_INPUT</p>
					</div>

					<!-- Result Image -->
					<div v-if="imageUrl" class="relative z-10 w-full h-full flex items-center justify-center p-4">
						<div class="relative group">
							<img :src="imageUrl" class="max-w-full max-h-[70vh] object-contain shadow-neon-lg border border-accent/50" />
							<!-- Image Overlay Grid -->
							<div class="absolute inset-0 bg-[url('/grid.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
						</div>
					</div>

					<!-- Actions -->
					<div v-if="imageUrl" class="absolute bottom-8 right-8 flex gap-4 z-20">
						<CyberButton variant="outline" @click="copyPrompt">COPY_SOURCE</CyberButton>
						<CyberButton variant="default" @click="downloadImage(imageUrl)">DOWNLOAD</CyberButton>
					</div>

					<!-- Error -->
					<div v-if="errorMessage" class="absolute bottom-6 left-6 right-6 bg-destructive/10 border-l-4 border-destructive p-4 cyber-chamfer-sm">
						<p class="font-bold text-destructive font-mono flex items-center gap-2"><span>[ERROR]</span> {{ errorMessage }}</p>
					</div>
				</CyberCard>
			</div>
		</main>

		<!-- Mobile History Drawer -->
		<div v-if="showHistory" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden flex items-end sm:items-center justify-center" @click="showHistory = false">
			<div class="bg-card w-full max-w-md h-[80vh] border-t-2 border-accent cyber-chamfer p-6 overflow-y-auto" @click.stop>
				<h3 class="font-bold text-xl uppercase mb-6 text-accent">SYSTEM_LOGS</h3>
				<div class="space-y-4">
					<div
						v-for="item in history"
						:key="item.id"
						@click="
							restoreFromHistory(item);
							showHistory = false;
						"
						class="border border-border p-3 flex gap-4 active:bg-accent/10">
						<img :src="item.url" class="w-16 h-16 object-cover border border-accent/30" />
						<div class="flex-1 min-w-0">
							<p class="text-xs font-mono text-accent truncate mb-1">>> {{ item.prompt }}</p>
							<p class="text-[10px] text-muted-foreground">{{ item.date }}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* Optional: Additional localized scoped animations if needed */
</style>
