import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Target,
  Bell,
  BarChart3,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

export const primaryNav: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Guru", to: "/teachers", icon: Users },
  { label: "Setoran", to: "/reports", icon: ClipboardList },
  { label: "Target", to: "/targets", icon: Target },
  { label: "Analitik", to: "/analytics", icon: BarChart3 },
];

export const secondaryNav: NavItem[] = [
  { label: "Notifikasi", to: "/notifications", icon: Bell },
  { label: "Profil", to: "/profile", icon: UserRound },
  { label: "Pengaturan", to: "/settings", icon: Settings },
];

export const mobileNav: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Guru", to: "/teachers", icon: Users },
  { label: "Setoran", to: "/reports", icon: ClipboardList },
  { label: "Target", to: "/targets", icon: Target },
  { label: "Profil", to: "/profile", icon: UserRound },
];
