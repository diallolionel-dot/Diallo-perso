import { Castle, Swords, TrendingUp, UtensilsCrossed, ScrollText, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: "/" | "/nutrition" | "/arene" | "/evolution" | "/mentor";
  label: string;
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "QG", description: "Tableau de bord", icon: Castle },
  { href: "/nutrition", label: "Nutrition", description: "Repas, macros, journal", icon: UtensilsCrossed },
  { href: "/arene", label: "Arène", description: "Séances et exercices", icon: Swords },
  { href: "/evolution", label: "Évolution", description: "Pesées, mensurations, photos", icon: TrendingUp },
  { href: "/mentor", label: "Mentor", description: "Coach IA", icon: ScrollText },
];

export function isActivePath(pathname: string, href: NavItem["href"]): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
