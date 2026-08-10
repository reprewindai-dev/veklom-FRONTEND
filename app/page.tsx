"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";
import { motion } from "framer-motion";

export default function M2MLandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [resonance, setResonance] = useState(0); // 0 = chaos, 1 = absolute resonance

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Chaos Substrate Parameters (Lorenz Attractor)
    let x = 0.01;
    let y = 0;
    let z = 0;
    const a = 10;
    const b = 28;
    const c = 8.0 / 3.0;

    let points: { x: number; y: number; z: number }[] = [];
    const maxPoints = 2500;
    let dt = 0.005; // Base speed

    let currentResonance = 0; // Local tweening variable

    // Colors
    // Chaos: #FF5E7E (signal), #E8965A (ember)
    // Resonance: #4CF2D6 (cyan), #1E8B79 (cyan-dim)

    function hexToRgb(hex: string) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    }

    const c1 = hexToRgb("#FF5E7E");
    const c2 = hexToRgb("#E8965A");
    const r1 = hexToRgb("#4CF2D6");
    const r2 = hexToRgb("#1E8B79");

    const lerpColor = (c_chaos: any, c_res: any, t: number) => {
      return {
        r: Math.round(c_chaos.r + (c_res.r - c_chaos.r) * t),
        g: Math.round(c_chaos.g + (c_res.g - c_chaos.g) * t),
        b: Math.round(c_chaos.b + (c_res.b - c_chaos.b) * t),
      };
    };

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      // The system "learns" and achieves resonance over time (~10 seconds to full resonance)
      if (currentResonance < 1) {
        currentResonance += 0.0015;
        if (currentResonance > 1) currentResonance = 1;
        setResonance(currentResonance);
      }

      // Clear with trailing effect (alpha depends on resonance - clearer path at higher resonance)
      ctx.fillStyle = `rgba(13, 17, 20, ${0.1 + (currentResonance * 0.05)})`;
      ctx.fillRect(0, 0, width, height);

      // Adaptive speed (slows down and stabilizes as it reaches resonance)
      const dynamicDt = dt * (1 - currentResonance * 0.4);

      // Calculate next point
      const dx = a * (y - x) * dynamicDt;
      const dy = (x * (b - z) - y) * dynamicDt;
      const dz = (x * y - c * z) * dynamicDt;

      x += dx;
      y += dy;
      z += dz;

      points.push({ x, y, z });
      if (points.length > maxPoints) {
        points.shift();
      }

      // Draw Substrate
      ctx.save();
      // Center and scale
      ctx.translate(width / 2, height / 2);
      const scale = Math.min(width, height) / 70;
      ctx.scale(scale, scale);

      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        // Rotate for pseudo-3D feel
        const angle = time * 0.1;
        const rx = p.x * Math.cos(angle) - p.y * Math.sin(angle);
        const ry = p.x * Math.sin(angle) + p.y * Math.cos(angle);
        
        const px = rx;
        const py = p.z - 25; // Offset Z to center

        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }

      // Interpolate colors based on learning state (resonance)
      const curColor1 = lerpColor(c1, r1, currentResonance);
      const curColor2 = lerpColor(c2, r2, currentResonance);

      const gradient = ctx.createLinearGradient(-30, -30, 30, 30);
      gradient.addColorStop(0, `rgb(${curColor1.r}, ${curColor1.g}, ${curColor1.b})`);
      gradient.addColorStop(1, `rgb(${curColor2.r}, ${curColor2.g}, ${curColor2.b})`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 0.5 + (currentResonance * 0.5); // Thicker, more stable line at resonance
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      ctx.restore();

      time += 0.01;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <main className="relative min-h-screen bg-[#0D1114] text-[#CFEFE9] font-sans overflow-hidden">
      {/* Substrate Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-40" />

      {/* Grid overlay */}
      <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      <div className="absolute inset-0 z-0" style={{ backgroundImage: 'radial-gradient(rgba(76,242,214,0.1) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.3 }}></div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 border-b border-[#4CF2D6]/20 bg-[#0D1114]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center border border-[#4CF2D6]/30 bg-[#07090B]">
            <span className="font-serif text-[#4CF2D6] font-bold">V</span>
          </div>
          <span className="font-mono text-xs tracking-widest uppercase text-[#4CF2D6]/80">VEKLOM</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/dev" className="text-xs font-mono uppercase text-[#CFEFE9]/60 hover:text-[#4CF2D6] transition-colors">Marketing (.dev)</Link>
          <Link href="/os" className="text-xs font-mono uppercase text-[#CFEFE9]/60 hover:text-[#4CF2D6] transition-colors">Capability OS</Link>
          <Link href="/vnp" className="text-xs font-mono uppercase text-[#CFEFE9]/60 hover:text-[#4CF2D6] transition-colors">VNP Mesh</Link>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 text-center">
        
        {/* Resonance Status Pill */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mb-8 px-4 py-1.5 border rounded-full flex items-center gap-3"
          style={{
            borderColor: `rgba(76, 242, 214, ${0.2 + resonance * 0.4})`,
            backgroundColor: `rgba(7, 9, 11, 0.8)`
          }}
        >
          <div className="flex gap-1 items-center">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: resonance > 0.9 ? '#4CF2D6' : '#FF5E7E' }}></span>
          </div>
          <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: resonance > 0.9 ? '#4CF2D6' : '#E8965A' }}>
            {resonance > 0.9 ? 'Adaptive Resonance Achieved' : 'Synthesizing Chaos Substrate...'}
          </span>
          <span className="font-mono text-[10px] text-[#4CF2D6]/50">{(resonance * 100).toFixed(1)}%</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium tracking-tight mb-6 max-w-4xl leading-[1.1]"
          style={{
            color: '#CFEFE9',
            textShadow: resonance > 0.9 ? '0 0 40px rgba(76,242,214,0.3)' : 'none'
          }}
        >
          The Threshold of <br className="hidden md:block"/>
          <span className="italic opacity-90" style={{ color: resonance > 0.9 ? '#4CF2D6' : '#CFEFE9' }}>M2M Trust</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-lg md:text-xl text-[#CFEFE9]/60 max-w-2xl font-light leading-relaxed mb-12"
        >
          When internal capacity to change matches the speed and shape of the change happening around you. Friction drops to zero. You know exactly how to move.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex flex-col md:flex-row items-center gap-4"
        >
          <Link href="/os" className="group relative flex items-center gap-3 px-8 py-4 bg-[#4CF2D6] text-[#07090B] font-mono text-sm font-bold uppercase tracking-widest overflow-hidden">
            <span className="relative z-10">Enter Capability OS</span>
            <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
          </Link>
          <Link href="/vnp" className="flex items-center gap-3 px-8 py-4 border border-[#4CF2D6]/30 text-[#4CF2D6] font-mono text-sm font-bold uppercase tracking-widest hover:bg-[#4CF2D6]/10 transition-colors">
            <Terminal className="w-4 h-4" /> Initialize Mesh
          </Link>
        </motion.div>

      </div>
    </main>
  );
}
