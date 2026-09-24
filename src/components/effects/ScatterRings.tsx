"use client";

import { useEffect, useRef } from "react";

type Ring = {
  x0: number;
  y0: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  tilt: number;
  spin: number;
};

// DKU Life's gold tokens as rgb triplets for the canvas gradients below.
const GOLD_RGB = "184,144,63";
const GOLD_BRIGHT_RGB = "228,193,126";

/**
 * A field of sketched orbit rings that physically scatter away from the
 * cursor and spring back to their resting position once it moves on —
 * "rings you can push around". Renders as an absolute canvas filling its
 * `relative` parent.
 *
 * Pauses its rAF loop while off-screen (IntersectionObserver) and caps
 * devicePixelRatio at 2, per the effects ground rules.
 */
export function ScatterRings({ className, count }: { className?: string; count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !parent || !ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let rings: Ring[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let visible = true;

    const PUSH_RADIUS = 130;

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

      const n = count ?? Math.max(10, Math.round((width * height) / 34000));
      rings = Array.from({ length: n }, () => {
        const x0 = Math.random() * width;
        const y0 = Math.random() * height;
        return {
          x0,
          y0,
          x: x0,
          y: y0,
          vx: 0,
          vy: 0,
          r: 12 + Math.random() * 26,
          tilt: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.01,
        };
      });
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

      for (const ring of rings) {
        if (!reducedMotion) {
          const dx = ring.x - mouse.current.x;
          const dy = ring.y - mouse.current.y;
          const dist = Math.hypot(dx, dy);
          if (dist < PUSH_RADIUS) {
            const force = (1 - dist / PUSH_RADIUS) * 1.1;
            const angle = Math.atan2(dy, dx || 0.0001);
            ring.vx += Math.cos(angle) * force;
            ring.vy += Math.sin(angle) * force;
          }
          ring.vx += (ring.x0 - ring.x) * 0.025;
          ring.vy += (ring.y0 - ring.y) * 0.025;
          ring.vx *= 0.88;
          ring.vy *= 0.88;
          ring.x += ring.vx;
          ring.y += ring.vy;
          ring.tilt += ring.spin;
        }

        const displacement = Math.hypot(ring.x - ring.x0, ring.y - ring.y0);
        const opacity = 0.14 + Math.min(1, displacement / 40) * 0.35;

        ctx!.strokeStyle = `rgba(${GOLD_RGB},${opacity})`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx!.stroke();

        ctx!.save();
        ctx!.translate(ring.x, ring.y);
        ctx!.rotate(ring.tilt);
        ctx!.scale(1, 0.36);
        ctx!.beginPath();
        ctx!.arc(0, 0, ring.r, 0, Math.PI * 2);
        ctx!.stroke();
        ctx!.restore();

        ctx!.beginPath();
        ctx!.arc(ring.x, ring.y, 1.4, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${GOLD_BRIGHT_RGB},${Math.min(1, opacity + 0.15)})`;
        ctx!.fill();
      }

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
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
    />
  );
}
