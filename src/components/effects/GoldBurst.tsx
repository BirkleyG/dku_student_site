"use client";

import { useEffect, useRef } from "react";

type Ray = { angle: number; length: number };

// DKU Life's --color-gold-bright (#b9a46b) as an rgb triplet, so it can be
// composed into rgba() strings for the canvas gradients below.
const GOLD_RGB = "184,144,63";

/**
 * A sunburst of fine gold rays radiating from a fixed, off-center origin.
 * Rays sit at a low ever-present opacity; the ray nearest the cursor
 * brightens and thickens, so it reads as the cursor "illuminating"
 * individual lines rather than a soft following glow. Renders as an
 * absolute canvas filling its `relative` parent — origin position is given
 * as a percentage of that parent so it can be placed off-center, e.g.
 * behind one side of a hero.
 *
 * Pauses its rAF loop while off-screen (IntersectionObserver) and caps
 * devicePixelRatio at 2, per the effects ground rules.
 */
export function GoldBurst({
  originXPct = 30,
  originYPct = 32,
  rayCount = 40,
  className,
}: {
  originXPct?: number;
  originYPct?: number;
  rayCount?: number;
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
    let rays: Ray[] = [];

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

      const maxLen = Math.max(width, height) * 0.8;
      rays = Array.from({ length: rayCount }, (_, i) => {
        const angle = (i / rayCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
        const length = maxLen * (0.35 + Math.random() * 0.65);
        return { angle, length };
      });
    }

    function onMove(e: PointerEvent) {
      const rect = parent!.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onLeave() {
      mouse.current = { x: -9999, y: -9999 };
    }

    function distToSegment(
      px: number,
      py: number,
      x1: number,
      y1: number,
      x2: number,
      y2: number
    ) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lenSq = dx * dx + dy * dy;
      let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const cx = x1 + t * dx;
      const cy = y1 + t * dy;
      return Math.hypot(px - cx, py - cy);
    }

    function draw() {
      if (!visible) {
        raf = requestAnimationFrame(draw);
        return;
      }

      ctx!.clearRect(0, 0, width, height);
      const hasMouse = !reducedMotion && mouse.current.x > -999;

      for (const ray of rays) {
        const x2 = origin.x + Math.cos(ray.angle) * ray.length;
        const y2 = origin.y + Math.sin(ray.angle) * ray.length;

        let opacity = 0.3;
        let lineWidth = 1.3;
        if (hasMouse) {
          const dist = distToSegment(
            mouse.current.x,
            mouse.current.y,
            origin.x,
            origin.y,
            x2,
            y2
          );
          const boost = Math.max(0, 1 - dist / 70);
          opacity = Math.min(1, 0.3 + boost * 0.7);
          lineWidth = 1.3 + boost * 1.5;
        }

        const gradient = ctx!.createLinearGradient(origin.x, origin.y, x2, y2);
        gradient.addColorStop(0, `rgba(${GOLD_RGB},${opacity})`);
        gradient.addColorStop(1, `rgba(${GOLD_RGB},0)`);

        ctx!.beginPath();
        ctx!.moveTo(origin.x, origin.y);
        ctx!.lineTo(x2, y2);
        ctx!.strokeStyle = gradient;
        ctx!.lineWidth = lineWidth;
        ctx!.stroke();
      }

      const originBoost = hasMouse
        ? Math.max(0, 1 - Math.hypot(mouse.current.x - origin.x, mouse.current.y - origin.y) / 120)
        : 0;
      const glowR = 30 + originBoost * 40;
      const glow = ctx!.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, glowR);
      glow.addColorStop(0, `rgba(${GOLD_RGB},${0.36 + originBoost * 0.4})`);
      glow.addColorStop(1, `rgba(${GOLD_RGB},0)`);
      ctx!.fillStyle = glow;
      ctx!.beginPath();
      ctx!.arc(origin.x, origin.y, glowR, 0, Math.PI * 2);
      ctx!.fill();

      ctx!.beginPath();
      ctx!.arc(origin.x, origin.y, 3.5 + originBoost * 2, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(${GOLD_RGB},${0.7 + originBoost * 0.3})`;
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
  }, [originXPct, originYPct, rayCount]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
    />
  );
}
