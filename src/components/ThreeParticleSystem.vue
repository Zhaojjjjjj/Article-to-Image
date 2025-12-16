<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import * as THREE from "three";
import gsap from "gsap";

const container = ref(null);
let scene, camera, renderer, particles, animationId;
let mouseX = 0;
let mouseY = 0;

const props = defineProps({
	speed: {
		type: Number,
		default: 1,
	},
	active: {
		type: Boolean,
		default: true,
	},
});

function initThree() {
	if (!container.value) return;

	// SCENE
	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x000000, 0.001);

	// CAMERA
	camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.1, 2000);
	camera.position.z = 1000;

	// RENDERER
	renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(container.value.clientWidth, container.value.clientHeight);
	container.value.appendChild(renderer.domElement);

	// PARTICLES
	const geometry = new THREE.BufferGeometry();
	const vertices = [];
	const colors = [];

	const color1 = new THREE.Color(0x0ea5e9); // Sky Blue
	const color2 = new THREE.Color(0x6366f1); // Indigo

	for (let i = 0; i < 2000; i++) {
		const x = (Math.random() - 0.5) * 2000;
		const y = (Math.random() - 0.5) * 2000;
		const z = (Math.random() - 0.5) * 2000;
		vertices.push(x, y, z);

		// Mix colors
		const mixedColor = color1.clone().lerp(color2, Math.random());
		colors.push(mixedColor.r, mixedColor.g, mixedColor.b);
	}

	geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
	geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

	const textureLoader = new THREE.TextureLoader();
	// Simple circle sprite or just use a generated one to avoid assets issues
	const sprite = createCircleTexture();

	const material = new THREE.PointsMaterial({
		size: 4,
		vertexColors: true,
		map: sprite,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true,
		opacity: 0.8,
	});

	particles = new THREE.Points(geometry, material);
	scene.add(particles);

	// EVENT LISTENERS
	document.addEventListener("mousemove", onDocumentMouseMove);
	window.addEventListener("resize", onWindowResize);
}

function createCircleTexture() {
	const canvas = document.createElement("canvas");
	canvas.width = 32;
	canvas.height = 32;
	const context = canvas.getContext("2d");
	const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
	gradient.addColorStop(0, "rgba(255,255,255,1)");
	gradient.addColorStop(0.2, "rgba(255,255,255,0.8)");
	gradient.addColorStop(0.5, "rgba(255,255,255,0.2)");
	gradient.addColorStop(1, "rgba(0,0,0,0)");
	context.fillStyle = gradient;
	context.fillRect(0, 0, 32, 32);
	const texture = new THREE.CanvasTexture(canvas);
	return texture;
}

function onDocumentMouseMove(event) {
	mouseX = (event.clientX - window.innerWidth / 2) * 0.5;
	mouseY = (event.clientY - window.innerHeight / 2) * 0.5;
}

function onWindowResize() {
	if (!container.value) return;
	camera.aspect = container.value.clientWidth / container.value.clientHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(container.value.clientWidth, container.value.clientHeight);
}

function animate() {
	animationId = requestAnimationFrame(animate);
	render();
}

function render() {
	if (!particles) return;

	const time = Date.now() * 0.00005 * (props.active ? 5 : 1); // Speed up when active

	camera.position.x += (mouseX - camera.position.x) * 0.05;
	camera.position.y += (-mouseY - camera.position.y) * 0.05;
	camera.lookAt(scene.position);

	// Rotate entire system
	particles.rotation.x = time * 0.2;
	particles.rotation.y = time * 0.5;

	// Pulse effect if active
	if (props.active) {
		// Could add wave modification to positions here ideally, but simple rotation speedup is safer for perf
		scene.background = new THREE.Color(0x050510); // Slightly lighter dark when active
	} else {
		scene.background = new THREE.Color(0x000000);
	}

	renderer.render(scene, camera);
}

// Watch props
watch(
	() => props.active,
	(val) => {
		if (val) {
			gsap.to(camera.position, { z: 500, duration: 2, ease: "power2.inOut" });
		} else {
			gsap.to(camera.position, { z: 1000, duration: 2, ease: "power2.out" });
		}
	}
);

onMounted(() => {
	initThree();
	animate();
});

onUnmounted(() => {
	if (renderer) {
		renderer.dispose();
	}
	if (animationId) {
		cancelAnimationFrame(animationId);
	}
	document.removeEventListener("mousemove", onDocumentMouseMove);
	window.removeEventListener("resize", onWindowResize);
});
</script>

<template>
	<div ref="container" class="w-full h-full absolute inset-0 z-0 bg-black">
		<div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none"></div>
	</div>
</template>
