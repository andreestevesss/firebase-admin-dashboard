'use client';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'>;

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const sceneRef = useRef<{
		scene: THREE.Scene;
		camera: THREE.PerspectiveCamera;
		renderer: THREE.WebGLRenderer;
		particles: THREE.Points;
		animationId: number | null;
		count: number;
	} | null>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		// Check if Three.js is available
		if (typeof THREE === 'undefined') {
			console.error('Three.js is not loaded');
			return;
		}

		console.log('Initializing DottedSurface...');

		const SEPARATION = 150;
		const AMOUNTX = 40;
		const AMOUNTY = 60;

		// Scene setup
		const scene = new THREE.Scene();
		const fogColor = 0xffffff;
		scene.fog = new THREE.Fog(fogColor, 2000, 10000);

		const camera = new THREE.PerspectiveCamera(
			60,
			window.innerWidth / window.innerHeight,
			1,
			10000,
		);
		camera.position.set(0, 355, 1220);

		const renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true,
		});
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(fogColor, 0);

		containerRef.current.appendChild(renderer.domElement);

		// Create particles
		const positions: number[] = [];
		const colors: number[] = [];

		// Get current theme
		const isDarkMode = document.documentElement.classList.contains('dark') || 
						  window.matchMedia('(prefers-color-scheme: dark)').matches;

		for (let ix = 0; ix < AMOUNTX; ix++) {
			for (let iy = 0; iy < AMOUNTY; iy++) {
				const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
				const y = 0;
				const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

				positions.push(x, y, z);
				
				// Set colors based on theme
				if (isDarkMode) {
					colors.push(0.78, 0.78, 0.78); // Light gray for dark mode
				} else {
					colors.push(0, 0, 0); // Black for light mode
				}
			}
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
		geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

		const material = new THREE.PointsMaterial({
			size: 8,
			vertexColors: true,
			transparent: true,
			opacity: 0.8,
			sizeAttenuation: true,
		});

		const particles = new THREE.Points(geometry, material);
		scene.add(particles);

		let count = 0;
		let animationId: number | null = null;

		// Animation function
		const animate = () => {
			animationId = requestAnimationFrame(animate);

			const positionAttribute = geometry.attributes.position;
			const positions = positionAttribute.array as Float32Array;

			let i = 0;
			for (let ix = 0; ix < AMOUNTX; ix++) {
				for (let iy = 0; iy < AMOUNTY; iy++) {
					const index = i * 3;
					positions[index + 1] = 
						Math.sin((ix + count) * 0.3) * 50 +
						Math.sin((iy + count) * 0.5) * 50;
					i++;
				}
			}

			positionAttribute.needsUpdate = true;
			renderer.render(scene, camera);
			count += 0.1;
		};

		// Handle window resize
		const handleResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		};

		window.addEventListener('resize', handleResize);

		// Start animation
		animate();

		// Store references
		sceneRef.current = {
			scene,
			camera,
			renderer,
			particles,
			animationId,
			count,
		};

		// Cleanup function
		return () => {
			window.removeEventListener('resize', handleResize);
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
			if (sceneRef.current) {
				sceneRef.current.scene.remove(particles);
				particles.geometry.dispose();
				particles.material.dispose();
				sceneRef.current.renderer.dispose();
				if (containerRef.current && sceneRef.current.renderer.domElement) {
					containerRef.current.removeChild(sceneRef.current.renderer.domElement);
				}
			}
		};
	}, []);

	// Update theme when it changes
	const { theme } = useTheme();
	useEffect(() => {
		if (sceneRef.current) {
			const isDarkMode = theme === 'dark' || 
							  (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
			
			const colors = sceneRef.current.particles.geometry.attributes.color.array as Float32Array;
			for (let i = 0; i < colors.length; i += 3) {
				if (isDarkMode) {
					colors[i] = 0.78;     // R
					colors[i + 1] = 0.78; // G  
					colors[i + 2] = 0.78; // B
				} else {
					colors[i] = 0;       // R
					colors[i + 1] = 0;   // G
					colors[i + 2] = 0;   // B
				}
			}
			sceneRef.current.particles.geometry.attributes.color.needsUpdate = true;
		}
	}, [theme]);

	return (
		<div
			ref={containerRef}
			className={cn('pointer-events-none fixed inset-0 -z-10', className)}
			{...props}
		/>
	);
}
