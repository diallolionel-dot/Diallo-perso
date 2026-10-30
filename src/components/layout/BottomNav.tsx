"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActivePath } from "@/lib/navigation";
import { cn } from "@/lib/cn";

/** Barre de navigation basse, pensée pour le pouce. */
export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/connexion") return null;

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-night-950/90 pb-safe backdrop-blur-xl"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-16 flex-col items-center justify-center gap-1 text-[0.68rem] font-semibold transition-colors",
                  active ? "text-teal-300" : "text-ink-muted hover:text-ink-soft",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-0 h-0.5 w-8 rounded-full bg-teal-400 shadow-[0_0_10px_var(--color-teal-400)] transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icon aria-hidden className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
