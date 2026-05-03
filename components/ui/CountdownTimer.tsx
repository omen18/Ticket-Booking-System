"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils/cn";

interface CountdownTimerProps {
  seconds: number;
  onExpire?: () => void;
}

export default function CountdownTimer({ seconds, onExpire }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.();
      return;
    }

    const timer = setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [onExpire, remaining]);

  const formatted = useMemo(() => {
    const mins = Math.floor(remaining / 60)
      .toString()
      .padStart(2, "0");
    const secs = (remaining % 60).toString().padStart(2, "0");

    return `${mins}:${secs}`;
  }, [remaining]);

  return (
    <div className={cn("font-mono text-sm font-semibold text-[var(--text-primary)]", remaining <= 120 && "text-red-600")}>
      {formatted}
    </div>
  );
}
