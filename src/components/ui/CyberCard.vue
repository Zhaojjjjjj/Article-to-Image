<script setup>
defineProps({
	variant: {
		type: String,
		default: "default",
		validator: (val) => ["default", "terminal", "holographic"].includes(val),
	},
	decoration: {
		type: Boolean,
		default: true,
	},
});
</script>

<template>
	<div
		class="relative cyber-chamfer transition-all duration-300 group"
		:class="{
			'bg-card border border-border hover:border-accent hover:shadow-neon-sm': variant === 'default',
			'bg-background border border-border pt-8': variant === 'terminal',
			'bg-muted/30 border border-accent/30 backdrop-blur-md shadow-neon-sm hover:shadow-neon': variant === 'holographic',
		}">
		<!-- Terminal Header -->
		<div v-if="variant === 'terminal'" class="absolute top-0 left-0 w-full h-8 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
			<div class="w-3 h-3 rounded-full bg-destructive/50"></div>
			<div class="w-3 h-3 rounded-full bg-yellow-500/50"></div>
			<div class="w-3 h-3 rounded-full bg-green-500/50"></div>
		</div>

		<!-- Holographic Corners -->
		<div v-if="variant === 'holographic'" class="absolute inset-0 pointer-events-none">
			<div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-accent"></div>
			<div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-accent"></div>
			<div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-accent"></div>
			<div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-accent"></div>
		</div>

		<!-- Content -->
		<div class="p-6 relative z-10">
			<slot />
		</div>
	</div>
</template>
