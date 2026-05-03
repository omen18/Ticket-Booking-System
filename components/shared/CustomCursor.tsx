"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    document.body.classList.add("no-cursor");

    let rafId: number;
    let mx = -300, my = -300;
    let rx = -300, ry = -300;
    let hovered = false;
    let pressing = false;

    function onMove(e: MouseEvent) { mx = e.clientX; my = e.clientY; }

    function onOver(e: MouseEvent) {
      const t = e.target as Element;
      if (t.closest("button,a,input,textarea,select,[role='button'],[data-cursor]")) {
        hovered = true;
      }
    }
    function onOut(e: MouseEvent) {
      const t = e.target as Element;
      if (t.closest("button,a,input,textarea,select,[role='button'],[data-cursor]")) {
        hovered = false;
      }
    }
    function onDown() { pressing = true; }
    function onUp()   { pressing = false; }

    function tick() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;

      const dot  = dotRef.current;
      const ring = ringRef.current;

      if (dot) {
        dot.style.transform = `translate(${mx - 5}px,${my - 5}px) scale(${pressing ? 0.5 : 1})`;
      }

      if (ring) {
        const size   = hovered ? 52 : 36;
        const offset = size / 2;
        const scale  = pressing ? 0.82 : 1;
        ring.style.transform = `translate(${rx - offset}px,${ry - offset}px) scale(${scale})`;
        ring.style.width  = `${size}px`;
        ring.style.height = `${size}px`;
        ring.style.borderColor = hovered
          ? "rgba(18,123,163,0.9)"
          : "rgba(18,123,163,0.45)";
        ring.style.backgroundColor = hovered
          ? "rgba(18,123,163,0.08)"
          : "transparent";
      }

      rafId = requestAnimationFrame(tick);
    }

    document.addEventListener("mousemove", onMove,  { passive: true });
    document.addEventListener("mouseover", onOver,  { passive: true });
    document.addEventListener("mouseout",  onOut,   { passive: true });
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup",   onUp);
    tick();

    return () => {
      document.body.classList.remove("no-cursor");
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout",  onOut);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup",   onUp);
    };
  }, []);

  return (
    <>
      {/* Dot – snaps instantly */}
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[10001] h-[10px] w-[10px] rounded-full bg-[var(--accent)]"
        style={{ willChange: "transform", transition: "transform 0.06s ease, opacity 0.1s" }}
      />
      {/* Ring – lags behind */}
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[10000] rounded-full border"
        style={{
          width: 36, height: 36,
          borderColor: "rgba(18,123,163,0.45)",
          willChange: "transform, width, height",
          transition: "width 0.28s cubic-bezier(0.34,1.56,0.64,1), height 0.28s cubic-bezier(0.34,1.56,0.64,1), border-color 0.2s, background-color 0.2s, transform 0s",
        }}
      />
    </>
  );
}
