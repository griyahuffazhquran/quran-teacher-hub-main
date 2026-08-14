import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Target,
  Bell,
  BarChart3,
  Settings,
  UserRound,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/data/types";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  badgeKey?: "announcements" | "notifications";
};

export function getPrimaryNav(role?: UserRole): NavItem[] {
  if (role === "upgrader") {
    return [
      { label: "Dashboard", to: "/", icon: LayoutDashboard },
      { label: "Setoran", to: "/reports", icon: ClipboardList },
      { label: "Target", to: "/targets", icon: Target },
      { label: "Pengumuman", to: "/announcements", icon: Megaphone, badgeKey: "announcements" },
      { label: "Guru", to: "/teachers", icon: Users },
      { label: "Analitik", to: "/analytics", icon: BarChart3 },
    ];
  }

  // Regular teacher navigation (Only Dashboard, Setoran, Target, Pengumuman)
  return [
    { label: "Dashboard", to: "/", icon: LayoutDashboard },
    { label: "Setoran", to: "/reports", icon: ClipboardList },
    { label: "Target", to: "/targets", icon: Target },
    { label: "Pengumuman", to: "/announcements", icon: Megaphone, badgeKey: "announcements" },
  ];
}

export function getSecondaryNav(role?: UserRole): NavItem[] {
  if (role === "upgrader") {
    return [
      { label: "Notifikasi", to: "/notifications", icon: Bell, badgeKey: "notifications" },
      { label: "Profil", to: "/profile", icon: UserRound },
      { label: "Pengaturan", to: "/settings", icon: Settings },
    ];
  }

  return [
    { label: "Notifikasi", to: "/notifications", icon: Bell, badgeKey: "notifications" },
    { label: "Profil", to: "/profile", icon: UserRound },
    { label: "Pengaturan", to: "/settings", icon: Settings },
  ];
}

export function getMobileNav(role?: UserRole): NavItem[] {
  if (role === "upgrader") {
    return [
      { label: "Dashboard", to: "/", icon: LayoutDashboard },
      { label: "Setoran", to: "/reports", icon: ClipboardList },
      { label: "Target", to: "/targets", icon: Target },
      { label: "Pengumuman", to: "/announcements", icon: Megaphone, badgeKey: "announcements" },
      { label: "Profil", to: "/profile", icon: UserRound },
    ];
  }

  // Mobile Navbar for regular teachers: Dashboard, Setoran, Target, Pengumuman, Profil
  return [
    { label: "Dashboard", to: "/", icon: LayoutDashboard },
    { label: "Setoran", to: "/reports", icon: ClipboardList },
    { label: "Target", to: "/targets", icon: Target },
    { label: "Pengumuman", to: "/announcements", icon: Megaphone, badgeKey: "announcements" },
    { label: "Profil", to: "/profile", icon: UserRound },
  ];
}

export const primaryNav: NavItem[] = getPrimaryNav("upgrader");
export const secondaryNav: NavItem[] = getSecondaryNav("upgrader");
export const mobileNav: NavItem[] = getMobileNav("teacher");
