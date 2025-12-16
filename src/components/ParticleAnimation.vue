<script setup>
import { onMounted, onUnmounted, ref } from "vue";

const canvasRef = ref(null);
let animationId = null;
let particles = [];

const props = defineProps({
	active: Boolean,
});

class Particle {
	constructor(canvas) {
		this.canvas = canvas;
		this.x = Math.random() * canvas.width;
		this.y = Math.random() * canvas.height;
		this.size = Math.random() * 2 + 0.5;
		this.speedX = Math.random() * 1.5 - 0.75;
		this.speedY = Math.random() * 1.5 - 0.75;
		this.color = `rgba(${Math.floor(Math.random() * 100 + 100)}, ${Math.floor(Math.random() * 100 + 150)}, 255, ${Math.random() * 0.5 + 0.2})`;
	}

	update() {
		this.x += this.speedX;
		this.y += this.speedY;

		if (this.size > 0.2) this.size -= 0.01;

		if (this.x < 0 || this.x > this.canvas.width) this.speedX *= -1;
		if (this.y < 0 || this.y > this.canvas.height) this.speedY *= -1;
	}

	draw(ctx) {
		ctx.fillStyle = this.color;
		ctx.strokeStyle = this.color;
		ctx.lineWidth = 0.5;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
		ctx.fill();
	}
}

function initParticles() {
	const canvas = canvasRef.value;
	if (!canvas) return;

	particles = [];
	for (let i = 0; i < 100; i++) {
		particles.push(new Particle(canvas));
	}
}

function animate() {
	const canvas = canvasRef.value;
	if (!canvas) return;

	const ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Add new particles periodically
	if (Math.random() < 0.1) particles.push(new Particle(canvas));

	for (let i = 0; i < particles.length; i++) {
		particles[i].update();
		particles[i].draw(ctx);

		// Remove small particles
		if (particles[i].size <= 0.3) {
			particles.splice(i, 1);
			i--;
		}
	}

	// Connect particles (constellation effect)
	for (let a = 0; a < particles.length; a++) {
		for (let b = a; b < particles.length; b++) {
			const dx = particles[a].x - particles[b].x;
			const dy = particles[a].y - particles[b].y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < 60) {
				ctx.strokeStyle = "rgba(100, 149, 237, 0.15)";
				ctx.lineWidth = 0.5;
				ctx.beginPath();
				ctx.moveTo(particles[a].x, particles[a].y);
				ctx.lineTo(particles[b].x, particles[b].y);
				ctx.stroke();
			}
		}
	}

	animationId = requestAnimationFrame(animate);
}

function resizeCanvas() {
	if (canvasRef.value) {
		canvasRef.value.width = canvasRef.value.parentElement.offsetWidth;
		canvasRef.value.height = canvasRef.value.parentElement.offsetHeight;
		initParticles();
	}
}

onMounted(() => {
	window.addEventListener("resize", resizeCanvas);
	resizeCanvas();
	animate();
});

onUnmounted(() => {
	window.removeEventListener("resize", resizeCanvas);
	cancelAnimationFrame(animationId);
});
</script>

<template>
	<canvas ref="canvasRef" class="absolute inset-0 w-full h-full pointer-events-none z-0"></canvas>
</template>
