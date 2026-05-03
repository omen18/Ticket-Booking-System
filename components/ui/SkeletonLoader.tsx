import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type SkeletonVariant = "card" | "text" | "avatar" | "seat";

interface SkeletonLoaderProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
}

const variantClasses: Record<SkeletonVariant, string> = {
  card: "h-40 w-full rounded-2xl",
  text: "h-4 w-full rounded-md",
  avatar: "h-12 w-12 rounded-full",
  seat: "h-8 w-8 rounded-lg",
};

export default function SkeletonLoader({ variant = "card", className, ...props }: SkeletonLoaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-zinc-200/70",
        "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r",
        "before:from-transparent before:via-white/70 before:to-transparent before:animate-shimmer",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
