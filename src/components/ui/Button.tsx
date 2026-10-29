import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-gold-500/50 bg-gradient-to-b from-gold-400 to-gold-500 text-night-950 shadow-[0_6px_20px_-10px_var(--color-gold-400)] hover:from-gold-300",
  ghost: "border-line-strong bg-night-800 text-ink-soft hover:border-teal-500/50 hover:text-ink",
};

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
}

export function Button({ variant = "ghost", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 text-sm font-semibold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:saturate-[0.35]",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
