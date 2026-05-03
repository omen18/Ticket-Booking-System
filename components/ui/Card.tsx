import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean;
}

export default function Card({ className, hoverLift = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 transition duration-200",
        hoverLift && "hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
      {...props}
    />
  );
}
