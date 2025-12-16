<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import gsap from "gsap";
import ThreeParticleSystem from "./components/ThreeParticleSystem.vue";

const { t, locale } = useI18n();

// --- State ---
const articleTitle = ref("");
const articleText = ref("");
const stylePreset = ref("cyberpunk"); // Default to something cool
const aspectRatio = ref("1664*928");
const isLoading = ref(false);
const imageUrl = ref("");
// const imageUrl = ref('https://dashscope-result-wlcb-acdr-1.oss-cn-wulanchabu-acdr-1.aliyuncs.com/7d/c6/20251216/cfc32567/9da4f136-df1d-4c2b-b050-976892de3c35-1.png?Expires=1766461863&OSSAccessKeyId=LTAI5tKPD3TMqf2Lna1fASuh&Signature=0zLfU3048YoRew15D%2Fm8kyqXNm4%3D') // Debug
const usedPrompt = ref("");
const errorMessage = ref("");
const history = ref([]);
const showHistory = ref(false);

// --- Refs for Animation ---
const mainContainer = ref(null);
const inputSection = ref(null);
const previewSection = ref(null);
const titleRef = ref(null);

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
	{ id: "1664*928", name: t("ratios.landscape"), label: "16:9" },
	{ id: "1328*1328", name: t("ratios.square"), label: "1:1" },
	{ id: "928*1664", name: t("ratios.portrait"), label: "9:16" },
]);

// --- Animations ---
onMounted(() => {
	// Initial entrance animation
	const tl = gsap.timeline();

	tl.from(titleRef.value, { y: -50, opacity: 0, duration: 1, ease: "power3.out" }).from(inputSection.value, { x: -50, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.5").from(previewSection.value, { x: 50, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.6");

	// Load history
	const saved = localStorage.getItem("img_history");
	if (saved) history.value = JSON.parse(saved);
});

function toggleLanguage() {
	locale.value = locale.value === "zh" ? "en" : "zh";
}

// --- Logic ---
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

	// Transition Preview to Loading
	gsap.to(previewSection.value, { scale: 0.98, opacity: 0.8, duration: 0.5 });

	try {
		const prompt = buildImagePrompt(articleText.value, articleTitle.value, stylePreset.value, aspectRatio.value);
		usedPrompt.value = prompt;
		const url = await generateImage(prompt, aspectRatio.value);
		imageUrl.value = url;
		addToHistory(url, prompt, stylePreset.value);

		// Animate Image In
		nextTick(() => {
			gsap.fromTo(".result-image", { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1, ease: "elastic.out(1, 0.75)" });
		});
	} catch (error) {
		console.error(error);
		errorMessage.value = error.message;
	} finally {
		isLoading.value = false;
		gsap.to(previewSection.value, { scale: 1, opacity: 1, duration: 0.5 });
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
	// Small toast could be added here
}

const isGenerateDisabled = computed(() => !articleText.value.trim() || isLoading.value);
</script>

<template>
	<div class="relative min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-pink-500 selection:text-white">
		<!-- 3D Background -->
		<div class="fixed inset-0 z-0">
			<ThreeParticleSystem :active="isLoading" />
		</div>

		<!-- Main Content -->
		<div class="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
			<!-- Header -->
			<header ref="titleRef" class="flex justify-between items-center mb-8 py-4 border-b border-white/10 backdrop-blur-md rounded-2xl px-6 bg-black/20">
				<div class="flex items-center gap-4">
					<div class="w-10 h-10 bg-gradient-to-tr from-pink-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/40">
						<span class="font-bold text-xl">A</span>
					</div>
					<h1 class="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
						{{ t("title") }}
					</h1>
				</div>
				<div class="flex items-center gap-4">
					<button @click="showHistory = !showHistory" class="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
					</button>
					<button @click="toggleLanguage" class="text-xs font-bold uppercase tracking-widest px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all hover:scale-105">
						{{ locale === "zh" ? "EN" : "中" }}
					</button>
				</div>
			</header>

			<main class="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
				<!-- LEFT: Controls -->
				<section ref="inputSection" class="lg:col-span-4 flex flex-col gap-6">
					<!-- Glass Card -->
					<div class="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col gap-6 h-full relative overflow-hidden group">
						<!-- Glow Effect -->
						<div class="absolute -top-20 -right-20 w-40 h-40 bg-pink-500/20 blur-3xl rounded-full group-hover:bg-pink-500/30 transition-all duration-1000"></div>

						<h2 class="text-xs font-bold text-pink-400 uppercase tracking-[0.2em] mb-2">{{ t("config") }}</h2>

						<div class="space-y-4">
							<div class="space-y-1">
								<label class="text-xs font-medium text-slate-400 ml-1">{{ t("articleTitle") }}</label>
								<input v-model="articleTitle" type="text" :placeholder="t('articleTitlePlaceholder')" class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 outline-none transition-all shadow-inner" />
							</div>

							<div class="space-y-1">
								<label class="text-xs font-medium text-slate-400 ml-1">{{ t("articleContent") }}</label>
								<textarea v-model="articleText" rows="8" :placeholder="t('articleContentPlaceholder')" class="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 outline-none transition-all resize-none shadow-inner"></textarea>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-1">
								<label class="text-xs font-medium text-slate-400 ml-1">{{ t("style") }}</label>
								<div class="relative">
									<select v-model="stylePreset" class="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-pink-500/50 outline-none cursor-pointer hover:bg-white/5 transition-colors">
										<option v-for="s in styles" :key="s.id" :value="s.id">{{ s.name }}</option>
									</select>
									<div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
									</div>
								</div>
							</div>
							<div class="space-y-1">
								<label class="text-xs font-medium text-slate-400 ml-1">{{ t("ratio") }}</label>
								<div class="relative">
									<select v-model="aspectRatio" class="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-pink-500/50 outline-none cursor-pointer hover:bg-white/5 transition-colors">
										<option v-for="r in ratios" :key="r.id" :value="r.id">{{ r.label }}</option>
									</select>
									<div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
									</div>
								</div>
							</div>
						</div>

						<div class="mt-auto pt-4">
							<button @click="handleGenerate" :disabled="isGenerateDisabled" class="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-pink-600 to-violet-600 p-[1px] focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed">
								<div class="relative h-full w-full rounded-xl bg-slate-950 px-8 py-4 transition-all duration-300 group-hover:bg-transparent">
									<div class="flex items-center justify-center gap-2">
										<span v-if="isLoading" class="flex items-center gap-2 text-white font-bold tracking-wider">
											<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
												<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											CREATING...
										</span>
										<span v-else class="text-white font-bold tracking-wider text-sm flex items-center gap-2">
											GENERATE ARTWORK
											<svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
										</span>
									</div>
								</div>
							</button>
						</div>
					</div>
				</section>

				<!-- CENTER/RIGHT: Preview -->
				<section ref="previewSection" class="lg:col-span-8 h-full min-h-[500px] flex flex-col relative">
					<div class="flex-1 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl flex items-center justify-center group">
						<!-- Decorative Grid -->
						<div class="absolute inset-0 z-0 opacity-20" style="background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px); background-size: 40px 40px"></div>

						<!-- Loading/Dreaming Overlay -->
						<div v-if="isLoading" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
							<h3 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 animate-pulse tracking-widest uppercase">Dreaming</h3>
						</div>

						<!-- Placeholder -->
						<div v-if="!imageUrl && !isLoading" class="text-center p-10 z-10 opacity-50">
							<div class="w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mx-auto mb-4 animate-spin-slow">
								<svg class="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
							</div>
							<p class="text-lg font-medium text-white/60 tracking-wide">{{ t("readyDesc") }}</p>
						</div>

						<!-- Result -->
						<img v-if="imageUrl" :src="imageUrl" class="result-image relative z-10 max-w-full max-h-[70vh] object-contain p-2 shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]" />

						<!-- Error Toast -->
						<div v-if="errorMessage" class="absolute bottom-8 bg-red-500/90 text-white px-6 py-3 rounded-full backdrop-blur-md shadow-xl border border-red-400/50 flex items-center gap-3 animate-slide-up z-30">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
							{{ errorMessage }}
						</div>
					</div>

					<!-- Action Bar -->
					<div v-if="imageUrl" class="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-4 z-20">
						<div class="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 flex-1 min-w-0 flex items-center gap-3">
							<span class="text-[10px] font-bold text-pink-500 uppercase px-1.5 py-0.5 bg-pink-500/10 rounded border border-pink-500/20">Prompt</span>
							<p class="text-xs text-slate-300 truncate font-mono flex-1">{{ usedPrompt }}</p>
							<button @click="copyPrompt" class="text-slate-400 hover:text-white transition-colors">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
							</button>
						</div>
						<button @click="downloadImage(imageUrl)" class="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-slate-200 transition-colors shadow-lg flex items-center gap-2 transform hover:-translate-y-1">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
							Download
						</button>
					</div>
				</section>
			</main>

			<!-- Desktop History Sidebar (Absolute) -->
			<div class="hidden lg:block fixed left-6 top-1/2 -translate-y-1/2 z-20">
				<div class="flex flex-col gap-3">
					<div v-for="(item, i) in history.slice(0, 5)" :key="item.id" @click="restoreFromHistory(item)" class="w-12 h-12 rounded-lg border-2 border-white/20 bg-cover bg-center cursor-pointer hover:scale-110 hover:border-pink-500 transition-all shadow-lg relative group" :style="{ backgroundImage: `url(${item.url})`, transitionDelay: `${i * 50}ms` }">
						<div class="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur border border-white/10 px-3 py-1 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
							{{ item.date }}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap");

:root {
	font-family: "Space Grotesk", system-ui, sans-serif;
}

.animate-spin-slow {
	animation: spin 8s linear infinite;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.animate-slide-up {
	animation: slideUp 0.3s ease-out forwards;
}

@keyframes slideUp {
	from {
		opacity: 0;
		transform: translateY(20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
