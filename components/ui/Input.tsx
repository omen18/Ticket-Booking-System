"use client";

import { InputHTMLAttributes, ReactNode, useState } from "react";

import { cn } from "@/lib/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailingAction?: ReactNode;
}

export default function Input({
  label,
  error,
  leadingIcon,
  trailingAction,
  className,
  disabled,
  onFocus,
  onBlur,
  id,
  ...props
}: InputProps) {
  const [isFocused, setFocused] = useState(false);
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-") ?? "input-field";

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}

      <div
        className={cn(
          "neu-raised flex h-11 items-center gap-2 px-3 transition-all duration-200",
          isFocused &&
            "shadow-[inset_4px_4px_8px_var(--neu-dark),inset_-4px_-4px_8px_var(--neu-light)]",
          error && "ring-1 ring-[var(--danger)]",
          disabled && "opacity-60",
        )}
      >
        {leadingIcon && <span className="text-[var(--text-muted)]">{leadingIcon}</span>}
        <input
          id={inputId}
          className={cn(
            "h-full w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
            "focus:outline-none disabled:cursor-not-allowed",
            className,
          )}
          disabled={disabled}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {trailingAction && <span className="shrink-0">{trailingAction}</span>}
      </div>

      {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
