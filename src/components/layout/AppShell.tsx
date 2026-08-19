import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BookOpenText,
  LogOut,
  Menu,
  PanelLeft,
  PanelLeftClose,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationPopover } from "./NotificationPopover";
import { getMobileNav, getPrimaryNav, getSecondaryNav, type NavItem } from "./nav-items";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { useAutoSync } from "@/hooks/use-auto-sync";
import { logout } from "@/lib/services/auth-service";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { useCollection } from "@/hooks/use-repository";
import { announcementRepo } from "@/lib/data/repositories";
import { hasActiveDeadlineAnnouncements } from "@/lib/services/announcement-service";

function NavLink({
  item,
  collapsed,
  hasBadge,
  onNavigate,
}: {
  item: NavItem;
  collapsed?: boolean;
  hasBadge?: boolean;
  onNavigate?: (() => void) | undefined;
}) {
  const content = (
    <Link
      to={item.to}
      onClick={onNavigate}
      activeOptions={{ exact: item.to === "/" }}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl py-2.5 font-medium text-sidebar-foreground/70 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[status=active]:bg-sidebar-primary/15 data-[status=active]:text-sidebar-primary data-[status=active]:font-semibold",
        collapsed ? "justify-center px-0 size-11" : "px-3 text-sm",
      )}
    >
      <div className="relative flex items-center justify-center">
        <item.icon className="size-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
        {hasBadge && (
          <span className="absolute -top-1 -right-1 flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex size-2.5 rounded-full bg-destructive border border-background"></span>
          </span>
        )}
      </div>
      {!collapsed && <span className="truncate flex-1">{item.label}</span>}
      {!collapsed && hasBadge && (
        <span className="size-2 rounded-full bg-destructive animate-pulse" />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12} className="font-medium text-xs">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link
      to="/"
      className={cn(
        "group flex items-center gap-3 px-1 cursor-pointer transition-transform hover:opacity-90",
        collapsed && "justify-center px-0",
      )}
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-transform duration-200 group-hover:scale-105">
        <BookOpenText className="size-5" />
      </div>
      {!collapsed && (
        <div className="min-w-0 transition-all duration-300">
          <p className="truncate text-sm font-bold leading-tight tracking-tight group-hover:text-primary transition-colors">
            Griya Huffazh Quran
          </p>
          <p className="truncate text-[11px] font-medium text-muted-foreground">Upgrading System</p>
        </div>
      )}
    </Link>
  );
}

function SidebarNav({
  collapsed = false,
  role,
  hasAnnouncementBadge,
  onToggleCollapse,
  onNavigate,
  onLogoutClick,
}: {
  collapsed?: boolean;
  role?: any;
  hasAnnouncementBadge?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: (() => void) | undefined;
  onLogoutClick: () => void;
}) {
  const primary = getPrimaryNav(role);
  const secondary = getSecondaryNav(role);

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn("flex h-full flex-col gap-5 p-3.5", collapsed && "items-center px-2")}>
        {/* Header / Brand + Collapse Trigger */}
        <div className={cn("flex items-center justify-between", collapsed && "flex-col gap-3")}>
          <Brand collapsed={collapsed} />
          {onToggleCollapse && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleCollapse}
                  aria-label={collapsed ? "Perluas menu sidebar" : "Ciutkan menu sidebar"}
                  className="hidden size-8 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex"
                >
                  {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                {collapsed ? "Perluas Sidebar" : "Ciutkan Sidebar"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Primary Nav */}
        <nav className={cn("flex flex-col gap-1 w-full")}>
          {!collapsed && (
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Utama
            </p>
          )}
          {primary.map((item) => (
            <NavLink
              key={item.to}
              item={item}
              collapsed={collapsed}
              hasBadge={item.badgeKey === "announcements" ? Boolean(hasAnnouncementBadge) : false}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        {/* Secondary Nav */}
        <nav className={cn("flex flex-col gap-1 w-full")}>
          {!collapsed && (
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Akun
            </p>
          )}
          {secondary.map((item) => (
            <NavLink
              key={item.to}
              item={item}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        {/* Logout Action */}
        <div className="mt-auto w-full pt-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.();
                    onLogoutClick();
                  }}
                  className="flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="size-5 shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                Keluar
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                onLogoutClick();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-5 shrink-0" />
              <span>Keluar</span>
            </button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gemini_sidebar_collapsed") === "true";
    }
    return false;
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutSuccessOpen, setLogoutSuccessOpen] = useState(false);
  const [sessionExpiredOpen, setSessionExpiredOpen] = useState(false);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, role, ready, isUpgrader } = useSession();
  useAutoSync();

  const { rows: announcements } = useCollection(announcementRepo);
  const hasAnnBadge = hasActiveDeadlineAnnouncements(announcements);

  // Require Login Guard
  useEffect(() => {
    if (ready && !user) void navigate({ to: "/login" });
  }, [ready, user, navigate]);

  // Role-Based Access Guard (Item 10)
  useEffect(() => {
    if (ready && user && !isUpgrader) {
      if (pathname.startsWith("/teachers") || pathname.startsWith("/analytics")) {
        toast.error("Akses terbatas. Menu ini khusus untuk Upgrader/Pengurus.");
        void navigate({ to: "/" });
      }
    }
  }, [ready, user, isUpgrader, pathname, navigate]);

  // Item 7: 1-Hour Inactivity Auto-Logout Tracker
  useEffect(() => {
    if (!ready || !user) return;

    const INACTIVITY_LIMIT_MS = 3600000; // 1 hour
    let lastActivity = Date.now();

    const updateActivity = () => {
      lastActivity = Date.now();
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, updateActivity, { passive: true }));

    const interval = setInterval(() => {
      if (Date.now() - lastActivity >= INACTIVITY_LIMIT_MS) {
        logout();
        setSessionExpiredOpen(true);
      }
    }, 30000); // Check every 30s

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, updateActivity));
      clearInterval(interval);
    };
  }, [ready, user]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("gemini_sidebar_collapsed", String(next));
      return next;
    });
  };

  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Trigger logout confirm dialog first
  const handleLogoutClick = () => {
    setLogoutConfirmOpen(true);
  };

  const executeLogout = () => {
    setLogoutConfirmOpen(false);
    setLogoutLoading(true);
    setTimeout(() => {
      logout();
      setLogoutLoading(false);
      setLogoutSuccessOpen(true);
    }, 800);
  };

  const handleLogoutConfirmDone = () => {
    setLogoutSuccessOpen(false);
    void navigate({ to: "/login" });
  };

  const handleSessionExpiredDone = () => {
    setSessionExpiredOpen(false);
    void navigate({ to: "/login" });
  };

  const mobileNavItems = getMobileNav(role);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border bg-sidebar/95 backdrop-blur-md transition-all duration-300 ease-in-out lg:block",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <SidebarNav
          collapsed={collapsed}
          role={role}
          hasAnnouncementBadge={hasAnnBadge}
          onToggleCollapse={toggleCollapsed}
          onLogoutClick={handleLogoutClick}
        />
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Tutup menu"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-xs animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-sidebar shadow-2xl animate-fade-up">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3.5 rounded-full"
              aria-label="Tutup menu"
              onClick={() => setDrawerOpen(false)}
            >
              <X className="size-5" />
            </Button>
            <SidebarNav
              role={role}
              hasAnnouncementBadge={hasAnnBadge}
              onNavigate={() => setDrawerOpen(false)}
              onLogoutClick={handleLogoutClick}
            />
          </div>
        </div>
      )}

      {/* Main Wrapper */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          collapsed ? "lg:pl-[72px]" : "lg:pl-64",
        )}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/80 bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Buka menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="size-5" />
          </Button>

          {/* Top Panel Toggle Button for Desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Perluas menu sidebar" : "Ciutkan menu sidebar"}
            className="hidden size-9 text-muted-foreground hover:bg-accent hover:text-foreground lg:flex"
          >
            <PanelLeft className="size-5" />
          </Button>

          {/* Item 6: Clickable Title to Dashboard */}
          <Link
            to="/"
            className="truncate text-sm font-bold sm:text-base tracking-tight hover:text-primary transition-colors cursor-pointer"
          >
            {[...getPrimaryNav(role), ...getSecondaryNav(role)].find((i) =>
              i.to === "/" ? pathname === "/" : pathname.startsWith(i.to),
            )?.label ?? "Griya Huffazh Quran"}
          </Link>

          <div className="ml-auto flex items-center gap-1.5">
            <SyncStatusBadge />
            <NotificationPopover />
            <ThemeToggle />
            {user && (
              <Badge variant="secondary" className="ml-1 hidden sm:inline-flex rounded-full px-3 py-1 font-medium">
                {role === "upgrader" ? "Upgrader" : "Teacher"} • {user.name.split(" ").slice(-1)[0]}
              </Badge>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10 animate-fade-up">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Item 8: Simplified Navbar) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
        <ul className={cn("grid", mobileNavItems.length === 4 ? "grid-cols-4" : "grid-cols-5")}>
          {mobileNavItems.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const showBadge = item.badgeKey === "announcements" && hasAnnBadge;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "relative flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
                    active ? "text-primary font-semibold" : "text-muted-foreground",
                  )}
                >
                  <div className="relative flex items-center justify-center">
                    <item.icon className={cn("size-5 transition-transform", active && "scale-110")} />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 flex size-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                        <span className="relative inline-flex size-2 rounded-full bg-destructive border border-background"></span>
                      </span>
                    )}
                  </div>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Confirmation Dialog (Ya / Tidak) */}
      <Dialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <DialogContent className="max-w-md text-center p-6 space-y-4">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive border border-destructive/20">
            <LogOut className="size-6" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              Konfirmasi Keluar Akun
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin keluar dari sistem Griya Huffazh Quran Hub?
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setLogoutConfirmOpen(false)} className="h-9 text-xs">
              Batal
            </Button>
            <Button variant="destructive" onClick={executeLogout} className="h-9 text-xs font-semibold gap-1.5">
              <LogOut className="size-3.5" />
              <span>Ya, Keluar</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Loading Overlay */}
      {logoutLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs text-white animate-fade-in">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card text-card-foreground shadow-2xl border border-border">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-semibold">Sedang keluar dari akun...</p>
          </div>
        </div>
      )}

      {/* Item 12: Logout Success Modal ("Jazakumullahu Khairan") */}
      <Dialog open={logoutSuccessOpen} onOpenChange={() => handleLogoutConfirmDone()}>
        <DialogContent className="max-w-md text-center p-6 space-y-4">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary border border-primary/20">
            <Heart className="size-8 text-primary animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-foreground font-serif">
              Jazakumullahu Khairan wa Barakallahu Fikum
            </h3>
            <p className="text-base font-semibold text-primary">
              Semangat selalu!
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
              Terima kasih atas dedikasi dan ikhtiar Anda dalam mendidik serta menyimak setoran Al-Qur'an.
            </p>
          </div>

          <div className="pt-2">
            <Button onClick={handleLogoutConfirmDone} className="w-full gap-2 shadow-md">
              <span>Ke Halaman Login</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item 7: Session Expired Modal (Inactivity Timeout) */}
      <Dialog open={sessionExpiredOpen} onOpenChange={() => handleSessionExpiredDone()}>
        <DialogContent className="max-w-md text-center p-6 space-y-4">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertTriangle className="size-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Sesi Anda Telah Berakhir
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Demi keamanan akun, Anda telah otomatis keluar karena tidak ada aktivitas selama 1 jam. Silakan masuk kembali untuk melanjutkan.
            </p>
          </div>

          <div className="pt-2">
            <Button onClick={handleSessionExpiredDone} className="w-full gap-2 shadow-md">
              <span>Masuk Kembali</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
