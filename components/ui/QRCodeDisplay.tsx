"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  label?: string;
}

export default function QRCodeDisplay({ value, size = 160, label }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: { dark: "#2E221B", light: "#FFFDF8" },
      errorCorrectionLevel: "M",
    });
  }, [value, size]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        className="rounded-xl border border-[var(--border)] shadow-sm"
      />
      {label && (
        <p className="max-w-[160px] truncate text-center text-[10px] font-mono font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          {label}
        </p>
      )}
    </div>
  );
}
