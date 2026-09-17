"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * The living background: a canvas starfield (gentle twinkle, slow upward drift,
 * soft pointer parallax) behind two drifting aurora blooms (CSS). Fixed,
 * pointer-events-none, aria-hidden, -z-10. The animation loop touches only the
 * canvas, never React state. Under reduced motion the stars render once, static,
 * and the aurora keyframes are disabled in CSS.
 */
export function Atmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let raf = 0;
    let stars: {
      x: number;
      y: number;
      r: number;
      base: number;
      phase: number;
      speed: number;
      drift: number;
    }[] = [];
    const pointer = { curX: 0, curY: 0, tarX: 0, tarY: 0 };

    function seed() {
      const count = Math.round(Math.min(180, (width * height) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.3 + 0.3,
        base: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.8 + 0.3,
        drift: Math.random() * 0.06 + 0.01,
      }));
    }

    function resize() {
      width = canvas!.clientWidth;
      height = canvas!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function paintStatic() {
      ctx!.clearRect(0, 0, width, height);
      for (const s of stars) {
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(240,236,226,${s.base})`;
        ctx!.fill();
      }
    }

    function frame(t: number) {
      ctx!.clearRect(0, 0, width, height);
      pointer.curX += (pointer.tarX - pointer.curX) * 0.05;
      pointer.curY += (pointer.tarY - pointer.curY) * 0.05;
      for (const s of stars) {
        const twinkle = Math.sin(t * 0.001 * s.speed + s.phase) * 0.5 + 0.5;
        const alpha = s.base * (0.4 + 0.6 * twinkle);
        let y = (s.y - t * 0.001 * s.drift * 22) % height;
        if (y < 0) y += height;
        ctx!.beginPath();
        ctx!.arc(s.x + pointer.curX * s.r, y + pointer.curY * s.r, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(240,236,226,${alpha})`;
        ctx!.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    const onResize = () => resize();
    const onMove = (e: PointerEvent) => {
      pointer.tarX = (e.clientX / window.innerWidth - 0.5) * 9;
      pointer.tarY = (e.clientY / window.innerHeight - 0.5) * 9;
    };

    window.addEventListener("resize", onResize);
    if (reduce) {
      paintStatic();
    } else {
      window.addEventListener("pointermove", onMove, { passive: true });
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduce]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="aurora aurora-1" />
      <div className="aurora aurora-2" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
