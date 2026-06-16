"use client";

import type { NavItem } from "../nav-items";

import { Avatar, Chip } from "@heroui/react";
import { Sidebar } from "@heroui-pro/react";

import { footerItems, navItems } from "../nav-items";

interface DashboardSidebarProps {
  basePath: string;
  disableNavigation?: boolean;
  onLogoutRequest?: () => void;
  pathname: string;
  user?: {
    displayName?: string | null;
    email?: string | null;
    loginName: string;
  };
}

export function DashboardSidebar({
  basePath,
  disableNavigation = false,
  onLogoutRequest,
  pathname,
  user,
}: DashboardSidebarProps) {
  return (
    <>
      <Sidebar>
        <SidebarContents
          basePath={basePath}
          disableNavigation={disableNavigation}
          pathname={pathname}
          onLogoutRequest={onLogoutRequest}
          user={user}
        />
      </Sidebar>
      <Sidebar.Mobile>
        <SidebarContents
          basePath={basePath}
          disableNavigation={disableNavigation}
          idPrefix="mobile-"
          pathname={pathname}
          onLogoutRequest={onLogoutRequest}
          user={user}
        />
      </Sidebar.Mobile>
    </>
  );
}

interface SidebarContentsProps {
  basePath: string;
  disableNavigation: boolean;
  idPrefix?: string;
  onLogoutRequest?: () => void;
  pathname: string;
  user?: {
    displayName?: string | null;
    email?: string | null;
    loginName: string;
  };
}

function SidebarContents({
  basePath,
  disableNavigation,
  idPrefix = "",
  onLogoutRequest,
  pathname,
  user,
}: SidebarContentsProps) {
  const name = user?.displayName || user?.email || user?.loginName || "Admin";
  const fallback = getInitials(name);

  return (
    <>
      <Sidebar.Header>
        <div className="flex items-center gap-3 px-1 py-1">
          <Avatar className="size-9">
            <Avatar.Image
              alt={name}
              src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue-light.jpg"
            />
            <Avatar.Fallback>{fallback}</Avatar.Fallback>
          </Avatar>
          <div className="flex min-w-0 flex-col" data-sidebar="label">
            <span className="text-foreground text-sm font-medium leading-tight">
              {name}
            </span>
            <span className="text-muted text-xs font-medium leading-tight">
              Admin
            </span>
          </div>
        </div>
      </Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Group>
          <Sidebar.Menu aria-label="Dashboard navigation">
            {navItems.map((item) => (
              <SidebarNavItem
                basePath={basePath}
                disableNavigation={disableNavigation}
                idPrefix={idPrefix}
                item={item}
                key={item.href}
                onLogoutRequest={onLogoutRequest}
                pathname={pathname}
              />
            ))}
          </Sidebar.Menu>
        </Sidebar.Group>
      </Sidebar.Content>
      <Sidebar.Footer>
        <Sidebar.Menu aria-label="Account">
          {footerItems.map((item) => (
            <SidebarNavItem
              basePath={basePath}
              disableNavigation={disableNavigation}
              idPrefix={idPrefix}
              item={item}
              key={item.href}
              onLogoutRequest={onLogoutRequest}
              pathname={pathname}
            />
          ))}
        </Sidebar.Menu>
      </Sidebar.Footer>
    </>
  );
}

function getInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "A";
}

interface SidebarNavItemProps {
  basePath: string;
  disableNavigation: boolean;
  idPrefix: string;
  item: NavItem;
  onLogoutRequest?: () => void;
  pathname: string;
}

function SidebarNavItem({
  basePath,
  disableNavigation,
  idPrefix,
  item,
  onLogoutRequest,
  pathname,
}: SidebarNavItemProps) {
  const Icon = item.icon;
  const fullHref = basePath + item.href;
  const isLogout = item.href === "/logout";
  const isCurrent =
    item.href === "/"
      ? pathname === fullHref || pathname === basePath || pathname === `${basePath}/`
      : pathname === fullHref || pathname.startsWith(`${fullHref}/`);

  return (
    <Sidebar.MenuItem
      href={disableNavigation || (isLogout && onLogoutRequest) ? undefined : fullHref}
      id={`${idPrefix}${item.href}`}
      isCurrent={isCurrent}
      onAction={isLogout ? onLogoutRequest : undefined}
      textValue={item.label}
    >
      <Sidebar.MenuIcon>
        <Icon className="size-4" />
      </Sidebar.MenuIcon>
      <Sidebar.MenuLabel>{item.label}</Sidebar.MenuLabel>
      {item.badge ? (
        <Sidebar.MenuChip>
          <Chip color="success" size="sm" variant="soft">
            {item.badge}
          </Chip>
        </Sidebar.MenuChip>
      ) : null}
    </Sidebar.MenuItem>
  );
}
