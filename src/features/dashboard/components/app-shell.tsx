"use client";

import type { ReactNode } from "react";

import { AppLayout } from "@heroui-pro/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

import { footerItems, navItems } from "../nav-items";

import { DashboardNavbar } from "./dashboard-navbar";
import { DashboardSidebar } from "./dashboard-sidebar";

type ShellUser = {
  displayName?: string | null;
  email?: string | null;
  loginName: string;
};

const routeLabels = new Map<string, string>(
  [...navItems, ...footerItems].map((item) => [item.href, item.label]),
);

export interface AppShellProps {
  basePath?: string;
  children: ReactNode;
  user?: ShellUser;
}

export function AppShell({ basePath = "", children, user }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const userName = user?.displayName || user?.email || user?.loginName || "Admin";
  const homeGreeting = `Good morning, ${userName.split(" ")[0] || "Admin"}`;

  const navigate = useCallback(
    (href: string) => router.push(basePath + href),
    [basePath, router],
  );

  const title = useMemo(() => {
    const relative = pathname.slice(basePath.length) || "/";

    if (relative === "/" || relative === "") return homeGreeting;

    return routeLabels.get(relative) ?? homeGreeting;
  }, [basePath, pathname]);

  return (
    <AppLayout
      navbar={<DashboardNavbar title={title} />}
      navigate={navigate}
      sidebar={<DashboardSidebar basePath={basePath} pathname={pathname} user={user} />}
      sidebarCollapsible="offcanvas"
    >
      {children}
    </AppLayout>
  );
}
