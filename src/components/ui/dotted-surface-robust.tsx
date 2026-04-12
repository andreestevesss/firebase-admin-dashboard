'use client';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'>;

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		if (!containerRef.current) return;

		console.log('🎬 Starting DottedSurface initialization...');

		// Create a simple canvas first to test
		const canvas = document.createElement('canvas');
		canvas.style.position = 'fixed';
		canvas.style.top = '0';
		canvas.style.left = '0';
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		canvas.style.pointerEvents = 'none';
		canvas.style.zIndex = '-10';
		
		containerRef.current.appendChild(canvas);

		// Basic Three.js setup
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		const renderer = new THREE.WebGLRenderer({ 
			canvas: canvas,
			alpha: true, 
			antialias: true 
		});
		
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(0x000000, 0);

		// Create dots in a grid pattern with wave animation
		const SEPARATION = 100;
		const AMOUNTX = 50;
		const AMOUNTY = 50;
		
		const geometry = new THREE.BufferGeometry();
		const vertices = [];
		const colors = [];

		for (let ix = 0; ix < AMOUNTX; ix++) {
			for (let iy = 0; iy < AMOUNTY; iy++) {
				const x = ix * SEPARATION - ((AMOUNTX * SEPARATION) / 2);
				const y = 0;
				const z = iy * SEPARATION - ((AMOUNTY * SEPARATION) / 2);
				
				vertices.push(x, y, z);
				colors.push(0.2, 0.2, 0.2); // Dark gray dots
			}
		}

		geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

		const material = new THREE.PointsMaterial({
			size: 3,
			vertexColors: true,
			transparent: true,
			opacity: 0.6,
		});

		const points = new THREE.Points(geometry, material);
		scene.add(points);

		camera.position.set(0, 500, 2000);
		camera.lookAt(0, 0, 0);

		let count = 0;
		let animationId: number;

		// Animation with wave effect
		const animate = () => {
			animationId = requestAnimationFrame(animate);

			const positions = geometry.attributes.position.array as Float32Array;
			let i = 0;
			
			for (let ix = 0; ix < AMOUNTX; ix++) {
				for (let iy = 0; iy < AMOUNTY; iy++) {
					const index = i * 3;
					// Wave animation
					positions[index + 1] = Math.sin((ix + count) * 0.3) * 100 + 
											Math.sin((iy + count) * 0.5) * 100;
					i++;
				}
			}

			geometry.attributes.position.needsUpdate = true;
			renderer.render(scene, camera);
			count += 0.05;
		};

		animate();
		setIsLoaded(true);

		console.log('✅ DottedSurface initialized successfully!');

		// Handle resize
		const handleResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		};

		window.addEventListener('resize', handleResize);

		// Cleanup
		return () => {
			console.log('🧹 Cleaning up DottedSurface...');
			window.removeEventListener('resize', handleResize);
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
			geometry.dispose();
			material.dispose();
			renderer.dispose();
			if (containerRef.current && canvas) {
				containerRef.current.removeChild(canvas);
			}
		};
	}, []);

	return (
		<div
			ref={containerRef}
			className={cn('pointer-events-none fixed inset-0 -z-10', className)}
			{...props}
		>
			{!isLoaded && (
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="text-gray-500 text-sm">Loading animation...</div>
				</div>
			)}
		</div>
	);
}
