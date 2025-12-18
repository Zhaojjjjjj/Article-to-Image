<script setup>
defineProps({
	modelValue: String,
	options: {
		type: Array,
		required: true,
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
			<div class="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-bold select-none group-focus-within:animate-pulse">$</div>

			<select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)" class="w-full appearance-none bg-input border border-border cyber-chamfer-sm pl-8 pr-10 py-3 text-accent focus:outline-none focus:border-accent focus:shadow-neon transition-all cursor-pointer">
				<option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
			</select>

			<!-- Custom Chevron -->
			<div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-accent">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
			</div>
		</div>
	</div>
</template>

<style scoped>
select {
	-webkit-appearance: none;
	-moz-appearance: none;
	appearance: none;
}
/* Hide default arrow in IE */
select::-ms-expand {
	display: none;
}
</style>
