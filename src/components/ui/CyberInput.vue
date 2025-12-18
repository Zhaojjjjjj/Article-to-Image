<script setup>
defineProps({
	modelValue: String,
	placeholder: String,
	type: {
		type: String,
		default: "text",
	},
	label: String,
});

defineEmits(["update:modelValue"]);
</script>

<template>
	<div class="flex flex-col gap-1 w-full font-mono">
		<label v-if="label" class="text-xs uppercase tracking-[0.2em] text-accent/80 pl-1 mb-1">{{ label }}</label>
		<div class="relative group">
			<!-- Prefix Icon -->
			<div class="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-bold select-none group-focus-within:animate-pulse">></div>

			<input :type="type" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" :placeholder="placeholder" class="w-full bg-input border border-border cyber-chamfer-sm pl-8 pr-4 py-3 text-accent placeholder-muted-foreground focus:outline-none focus:border-accent focus:shadow-neon transition-all" />
		</div>
	</div>
</template>
