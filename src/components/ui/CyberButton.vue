<script setup>
import { computed } from "vue";

const props = defineProps({
	variant: {
		type: String,
		default: "default",
		validator: (val) => ["default", "secondary", "outline", "ghost", "glitch"].includes(val),
	},
	disabled: {
		type: Boolean,
		default: false,
	},
});

const baseClasses = "relative font-mono uppercase tracking-widest transition-all duration-200 ease-out flex items-center justify-center gap-2 group cyber-chamfer-sm overflow-hidden";

const variantClasses = computed(() => {
	switch (props.variant) {
		case "default":
			return "bg-transparent border-2 border-accent text-accent hover:bg-accent hover:text-background hover:shadow-neon";
		case "secondary":
			return "bg-transparent border-2 border-accent-secondary text-accent-secondary hover:bg-accent-secondary hover:text-background hover:shadow-neon-secondary";
		case "outline":
			return "bg-transparent border border-border text-foreground hover:border-accent hover:text-accent hover:shadow-neon";
		case "ghost":
			return "bg-transparent border-none text-foreground hover:bg-accent/10 hover:text-accent";
		case "glitch":
			return "bg-accent text-background border-none hover:brightness-110 cyber-glitch";
		default:
			return "";
	}
});

const disabledClasses = computed(() => {
	return props.disabled ? "opacity-50 cursor-not-allowed pointer-events-none grayscale" : "cursor-pointer";
});
</script>

<template>
	<button :class="[baseClasses, variantClasses, disabledClasses]" :disabled="disabled" :data-text="variant === 'glitch' ? 'GLITCH' : ''">
		<!-- Inner Content with Z-Index to stay above backgrounds -->
		<div class="relative z-10 flex items-center gap-2">
			<slot />
		</div>

		<!-- Scanline overlay specifically for glitch/filled buttons -->
		<div v-if="variant === 'glitch'" class="absolute inset-0 bg-black/10 pointer-events-none" style="background-image: linear-gradient(transparent 50%, rgba(0, 0, 0, 0.5) 50%); background-size: 100% 4px"></div>
	</button>
</template>
