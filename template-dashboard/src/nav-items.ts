import type {ComponentType} from "react";

import {
  ArrowRightFromSquare,
  ChartColumn,
  CircleQuestion,
  Gear,
  House,
  ListCheck,
  Receipt,
} from "@gravity-ui/icons";

export type NavItem = {
  readonly href: string;
  readonly label: string;
  readonly icon: ComponentType<{className?: string}>;
  readonly badge?: string;
};

export const NAV_ITEMS: readonly NavItem[] = [
  {href: "/", icon: House, label: "Dashboard"},
  {href: "/orders", icon: Receipt, label: "Orders"},
  {badge: "New", href: "/tracker", icon: ListCheck, label: "Tracker"},
  {href: "/analytics", icon: ChartColumn, label: "Analytics"},
  {href: "/settings", icon: Gear, label: "Settings"},
] as const;

export const FOOTER_ITEMS: readonly NavItem[] = [
  {href: "/help", icon: CircleQuestion, label: "Help & Information"},
  {href: "/logout", icon: ArrowRightFromSquare, label: "Log out"},
] as const;
