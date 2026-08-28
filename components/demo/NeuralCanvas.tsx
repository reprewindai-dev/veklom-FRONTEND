"use client";

import React, { useRef, useEffect } from 'react';

interface Particle {
 x: number;
 y: number;
 vx: number;
 vy: number;
 life: number;
 maxLife: number;
}

interface NeuralCanvasProps {
 status: 'running' | 'halted';
 color?: string;
}

export function NeuralCanvas({ status, color = '#00E5FF' }: NeuralCanvasProps) {
 const canvasRef = useRef<HTMLCanvasElement>(null);
 
 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;
 const ctx = canvas.getContext('2d');
 if (!ctx) return;

 let width = canvas.width = canvas.offsetWidth;
 let height = canvas.height = canvas.offsetHeight;
 
 let particles: Particle[] = [];
 const maxParticles = 60;
 
 for (let i = 0; i < maxParticles; i++) {
 particles.push({
 x: Math.random() * width,
 y: Math.random() * height,
 vx: (Math.random() - 0.5) * 15, // Super fast
 vy: (Math.random() - 0.5) * 15,
 life: Math.random() * 100,
 maxLife: 100
 });
 }

 let animationFrameId: number;

 const render = () => {
 ctx.fillStyle = 'rgba(10, 14, 26, 0.2)'; // Trailing effect
 ctx.fillRect(0, 0, width, height);
 
 const isHalted = status === 'halted';
 const actualColor = isHalted ? '#FF4D4D' : color;

 particles.forEach((p, i) => {
 if (!isHalted) {
 p.x += p.vx;
 p.y += p.vy;
 
 if (p.x < 0 || p.x > width) p.vx *= -1;
 if (p.y < 0 || p.y > height) p.vy *= -1;
 
 // Random erratic jumps (neural firing)
 if (Math.random() < 0.05) {
 p.vx = (Math.random() - 0.5) * 20;
 p.vy = (Math.random() - 0.5) * 20;
 }
 }

 // Draw node
 ctx.beginPath();
 ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
 ctx.fillStyle = actualColor;
 ctx.shadowBlur = 10;
 ctx.shadowColor = actualColor;
 ctx.fill();

 // Draw connections
 for (let j = i + 1; j < particles.length; j++) {
 const p2 = particles[j];
 const dx = p.x - p2.x;
 const dy = p.y - p2.y;
 const dist = Math.sqrt(dx * dx + dy * dy);
 
 if (dist < 80) {
 ctx.beginPath();
 ctx.moveTo(p.x, p.y);
 ctx.lineTo(p2.x, p2.y);
 ctx.strokeStyle = `${actualColor}${Math.floor((1 - dist / 80) * 255).toString(16).padStart(2, '0')}`;
 ctx.lineWidth = 1;
 ctx.stroke();
 }
 }
 });
 
 animationFrameId = requestAnimationFrame(render);
 };
 
 render();
 
 const handleResize = () => {
 width = canvas.width = canvas.offsetWidth;
 height = canvas.height = canvas.offsetHeight;
 };
 window.addEventListener('resize', handleResize);
 
 return () => {
 window.removeEventListener('resize', handleResize);
 cancelAnimationFrame(animationFrameId);
 };
 }, [status, color]);

 return (
 <canvas 
 ref={canvasRef} 
 className={`w-full h-full rounded-lg border border-theme transition-colors ${status === 'halted' ? 'bg-[#1a0a0a]' : 'bg-[var(--theme-bg)]'}`}
 style={{ filter: status === 'halted' ? 'saturate(1.5) contrast(1.2)' : 'none' }}
 />
 );
}
