import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BookOpenText, LogOut, Menu, PanelLeft, PanelLeftClose, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationPopover } from "./NotificationPopover";
import { mobileNav, primaryNav, secondaryNav, type NavItem } from "./nav-items";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { logout } from "@/lib/services/auth-service";

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed?: boolean;
  onNavigate?: (() => void) | undefined;
}) {
  const content = (
    <Link
      to={item.to}
      onClick={onNavigate}
      activeOptions={{ exact: item.to === "/" }}
      className={cn(
        "group flex items-center gap-3 rounded-xl py-2.5 font-medium text-sidebar-foreground/70 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[status=active]:bg-sidebar-primary/15 data-[status=active]:text-sidebar-primary data-[status=active]:font-semibold",
        collapsed ? "justify-center px-0 size-11" : "px-3 text-sm",
      )}
    >
      <item.icon className="size-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      {!collapsed && <span className="truncate">{item.label}</span>}
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
    <div className={cn("flex items-center gap-3 px-1", collapsed && "justify-center px-0")}>
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-transform duration-200 hover:scale-105">
        <BookOpenText className="size-5" />
      </div>
      {!collapsed && (
        <div className="min-w-0 transition-all duration-300">
          <p className="truncate text-sm font-bold leading-tight tracking-tight">Griya Huffazh</p>
          <p className="truncate text-[11px] font-medium text-muted-foreground">Teacher Upgrading</p>
        </div>
      )}
    </div>
  );
}

function SidebarNav({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: (() => void) | undefined;
}) {
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
          {primaryNav.map((item) => (
            <NavLink key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </nav>

        {/* Secondary Nav */}
        <nav className={cn("flex flex-col gap-1 w-full")}>
          {!collapsed && (
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Akun
            </p>
          )}
          {secondaryNav.map((item) => (
            <NavLink key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
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
                    logout();
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
                logout();
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, role, ready } = useSession();

  useEffect(() => {
    if (ready && !user) void navigate({ to: "/login" });
  }, [ready, user, navigate]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("gemini_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border bg-sidebar/95 backdrop-blur-md transition-all duration-300 ease-in-out lg:block",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <SidebarNav collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
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
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
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

          <p className="truncate text-sm font-bold sm:text-base tracking-tight">
            {[...primaryNav, ...secondaryNav].find((i) =>
              i.to === "/" ? pathname === "/" : pathname.startsWith(i.to),
            )?.label ?? "Griya Huffazh Quran"}
          </p>

          <div className="ml-auto flex items-center gap-1.5">
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
        <ul className="grid grid-cols-5">
          {mobileNav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
                    active ? "text-primary font-semibold" : "text-muted-foreground",
                  )}
                >
                  <item.icon className={cn("size-5 transition-transform", active && "scale-110")} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
