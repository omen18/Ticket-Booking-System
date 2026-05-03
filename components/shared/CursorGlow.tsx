"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let rafId: number;
    let tx = -600, ty = -600;
    let cx = -600, cy = -600;

    function onMove(e: MouseEvent) {
      tx = e.clientX;
      ty = e.clientY;
    }

    function tick() {
      cx += (tx - cx) * 0.055;
      cy += (ty - cy) * 0.055;

      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${cx - 220}px, ${cy - 220}px)`;
        glowRef.current.style.opacity = tx < -200 ? "0" : "1";
      }

      rafId = requestAnimationFrame(tick);
    }

    document.addEventListener("mousemove", onMove, { passive: true });
    tick();

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[9998] h-[440px] w-[440px] rounded-full opacity-0 transition-opacity duration-500"
      style={{
        background:
          "radial-gradient(circle, rgba(18,123,163,0.13) 0%, rgba(53,168,214,0.07) 45%, transparent 70%)",
        willChange: "transform",
      }}
    />
  );
}
