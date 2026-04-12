'use client';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

type DottedSurfaceProps = Omit<React.ComponentProps<'div'>, 'ref'>;

export function DottedSurface({ className, ...props }: DottedSurfaceProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		console.log('Starting Three.js initialization...');

		// Basic scene setup
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
		
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(0x000000, 0);
		containerRef.current.appendChild(renderer.domElement);

		// Create simple dots
		const geometry = new THREE.BufferGeometry();
		const vertices = [];
		const colors = [];

		for (let i = 0; i < 1000; i++) {
			const x = (Math.random() - 0.5) * 1000;
			const y = (Math.random() - 0.5) * 1000;
			const z = (Math.random() - 0.5) * 1000;
			
			vertices.push(x, y, z);
			colors.push(0, 0, 0); // Black dots
		}

		geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

		const material = new THREE.PointsMaterial({
			size: 4,
			vertexColors: true,
			transparent: true,
			opacity: 0.8,
		});

		const points = new THREE.Points(geometry, material);
		scene.add(points);

		camera.position.z = 500;

		// Animation
		let animationId: number;
		const animate = () => {
			animationId = requestAnimationFrame(animate);
			points.rotation.x += 0.001;
			points.rotation.y += 0.002;
			renderer.render(scene, camera);
		};

		animate();

		// Handle resize
		const handleResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		};

		window.addEventListener('resize', handleResize);

		console.log('Three.js initialization complete!');

		// Cleanup
		return () => {
			window.removeEventListener('resize', handleResize);
			if (animationId) {
				cancelAnimationFrame(animationId);
			}
			geometry.dispose();
			material.dispose();
			renderer.dispose();
			if (containerRef.current && renderer.domElement) {
				containerRef.current.removeChild(renderer.domElement);
			}
		};
	}, []);

	return (
		<div
			ref={containerRef}
			className={cn('pointer-events-none fixed inset-0 -z-10', className)}
			{...props}
		/>
	);
}
