import type { ComponentType } from "react";

import {
  ArrowRightFromSquare,
  ChartColumn,
  CircleQuestion,
  Gear,
  House,
  ListCheck,
  Megaphone,
  Receipt,
} from "@gravity-ui/icons";

export type NavItem = {
  readonly badge?: string;
  readonly href: string;
  readonly icon: ComponentType<{ className?: string }>;
  readonly label: string;
};

export const navItems: readonly NavItem[] = [
  { href: "/", icon: House, label: "Dashboard" },
  { href: "/orders", icon: Receipt, label: "Orders" },
  { badge: "New", href: "/tracker", icon: ListCheck, label: "Tracker" },
  { href: "/analytics", icon: ChartColumn, label: "Analytics" },
  { badge: "Preview", href: "/operations", icon: ListCheck, label: "Operations" },
  { badge: "Preview", href: "/campaigns", icon: Megaphone, label: "Campaigns" },
  { href: "/settings", icon: Gear, label: "Settings" },
];

export const footerItems: readonly NavItem[] = [
  { href: "/help", icon: CircleQuestion, label: "Help & Information" },
  { href: "/logout", icon: ArrowRightFromSquare, label: "Log out" },
];
