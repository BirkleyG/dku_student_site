"use client";

import { useEffect, useRef } from "react";

type Ring = { radius: number; tickCount: number; speedBias: number; angle: number };

// DKU Life's gold tokens as rgb triplets for the canvas gradients below.
const GOLD_RGB = "184,144,63";
const GOLD_BRIGHT_RGB = "228,193,126";

/**
 * A sketched orbit-ring motif — several concentric rings, each marked with
 * small dial ticks so its rotation actually reads — spinning independently
 * within one another. Idle, they drift almost imperceptibly; the closer the
 * cursor gets to the center, the faster they spin, easing back down as it
 * pulls away. Used as the DKU Eats loading state, where there's no cursor
 * proximity signal to speak of — it just idles at its base spin. Renders as
 * an absolute canvas filling its `relative` parent.
 *
 * Pauses its rAF loop while off-screen (IntersectionObserver) and caps
 * devicePixelRatio at 2, per the effects ground rules.
 */
export function SunPulse({
  originXPct = 50,
  originYPct = 50,
  ringCount = 5,
  className,
}: {
  originXPct?: number;
  originYPct?: number;
  ringCount?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !parent || !ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let raf = 0;
    let visible = true;
    let origin = { x: 0, y: 0 };
    let rings: Ring[] = [];
    let intensity = 0;
    let proximityRadius = 200;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent!.clientWidth;
      height = parent!.clientHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.scale(dpr, dpr);

      origin = { x: width * (originXPct / 100), y: height * (originYPct / 100) };
      const maxR = Math.min(width, height) * 0.32;
      proximityRadius = maxR * 1.7;

      rings = Array.from({ length: ringCount }, (_, i) => ({
        radius: maxR * ((i + 1) / ringCount),
        tickCount: 5 + i * 2,
        speedBias: (i % 2 === 0 ? 1 : -0.7) * (0.5 + i * 0.18),
        angle: Math.random() * Math.PI * 2,
      }));
    }

    function onMove(e: PointerEvent) {
      const rect = parent!.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onLeave() {
      mouse.current = { x: -9999, y: -9999 };
    }

    function draw() {
      if (!visible) {
        raf = requestAnimationFrame(draw);
        return;
      }

      ctx!.clearRect(0, 0, width, height);

      const hasMouse = mouse.current.x > -999;
      const dist = Math.hypot(mouse.current.x - origin.x, mouse.current.y - origin.y);
      const target = hasMouse ? Math.max(0, 1 - dist / proximityRadius) : 0;
      intensity += (target - intensity) * 0.06;

      const BASE_SPIN = 0.001;
      for (const ring of rings) {
        if (!reducedMotion) {
          ring.angle += BASE_SPIN * ring.speedBias * (0.05 + intensity * 1.15);
        }

        const opacity = 0.22 + intensity * 0.28;
        ctx!.strokeStyle = `rgba(${GOLD_RGB},${opacity})`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.arc(origin.x, origin.y, ring.radius, 0, Math.PI * 2);
        ctx!.stroke();

        for (let i = 0; i < ring.tickCount; i++) {
          const a = ring.angle + (i / ring.tickCount) * Math.PI * 2;
          const x1 = origin.x + Math.cos(a) * (ring.radius - 4);
          const y1 = origin.y + Math.sin(a) * (ring.radius - 4);
          const x2 = origin.x + Math.cos(a) * (ring.radius + 4);
          const y2 = origin.y + Math.sin(a) * (ring.radius + 4);
          ctx!.beginPath();
          ctx!.moveTo(x1, y1);
          ctx!.lineTo(x2, y2);
          ctx!.strokeStyle = `rgba(${GOLD_BRIGHT_RGB},${Math.min(1, opacity + 0.2)})`;
          ctx!.stroke();
        }
      }

      ctx!.beginPath();
      ctx!.arc(origin.x, origin.y, 1.6, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(${GOLD_BRIGHT_RGB},${0.5 + intensity * 0.5})`;
      ctx!.fill();

      if (!reducedMotion) raf = requestAnimationFrame(draw);
    }

    resize();
    draw();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(parent);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(parent);

    parent.addEventListener("pointermove", onMove);
    parent.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerleave", onLeave);
    };
  }, [originXPct, originYPct, ringCount]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
    />
  );
}
