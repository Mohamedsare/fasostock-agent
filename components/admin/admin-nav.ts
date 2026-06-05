import {
  Gauge,
  Building2,
  Users,
  Bot,
  Wallet,
  ServerCog,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Surfaced in the mobile bottom tab bar. */
  primary?: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Vue d'ensemble", href: "/admin", icon: Gauge, primary: true },
  { label: "Organisations", href: "/admin/organizations", icon: Building2, primary: true },
  { label: "Utilisateurs", href: "/admin/users", icon: Users, primary: true },
  { label: "Agents WhatsApp", href: "/admin/agents", icon: Bot, primary: true },
  { label: "Revenus", href: "/admin/revenue", icon: Wallet },
  { label: "Système", href: "/admin/system", icon: ServerCog },
];
