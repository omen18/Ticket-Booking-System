"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import { ButtonHTMLAttributes, MouseEvent } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  magnetic?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]",
  secondary: "border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--accent-dark)] hover:bg-[rgba(18,123,163,0.08)]",
  ghost: "bg-transparent text-[var(--accent-dark)] hover:bg-[rgba(18,123,163,0.08)]",
  danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export default function Button({
  className,
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  magnetic = false,
  type = "button",
  ...props
}: ButtonProps) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 220, damping: 20, mass: 0.5 });
  const y = useSpring(rawY, { stiffness: 220, damping: 20, mass: 0.5 });

  const isDisabled = disabled || loading;

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!magnetic || isDisabled) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - (bounds.left + bounds.width / 2);
    const offsetY = event.clientY - (bounds.top + bounds.height / 2);

    rawX.set(offsetX * 0.14);
    rawY.set(offsetY * 0.16);

  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      style={magnetic ? { x, y } : undefined}
      className="inline-flex"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
        <span>{children}</span>
      </button>
    </motion.div>
  );
}
