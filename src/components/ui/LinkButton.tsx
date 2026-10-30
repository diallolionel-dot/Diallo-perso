import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type LinkButtonVariant = "primary" | "ghost";

const variantClasses: Record<LinkButtonVariant, string> = {
  primary:
    "border-gold-500/50 bg-gradient-to-b from-gold-400 to-gold-500 text-night-950 shadow-[0_6px_20px_-10px_var(--color-gold-400)] hover:from-gold-300",
  ghost: "border-line-strong bg-night-800 text-ink-soft hover:border-teal-500/50 hover:text-ink",
};

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: LinkButtonVariant;
}

/** Lien présenté comme un bouton (mêmes styles que Button). */
export function LinkButton({ variant = "ghost", className, ...props }: LinkButtonProps) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 text-sm font-semibold transition-colors",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
