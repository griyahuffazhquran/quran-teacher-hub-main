import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, BookOpenText, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./ThemeToggle";
import { mobileNav, primaryNav, secondaryNav, type NavItem } from "./nav-items";
import { cn } from "@/lib/utils";

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      activeOptions={{ exact: item.to === "/" }}
      className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground data-[status=active]:bg-sidebar-primary/10 data-[status=active]:text-sidebar-primary"
    >
      <item.icon className="size-[18px] shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
        <BookOpenText className="size-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold leading-tight">Griya Huffazh</p>
        <p className="truncate text-xs text-muted-foreground">Teacher Upgrading</p>
      </div>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Brand />
      <nav className="flex flex-col gap-1">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Utama
        </p>
        {primaryNav.map((item) => (
          <NavLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
      <nav className="flex flex-col gap-1">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Akun
        </p>
        {secondaryNav.map((item) => (
          <NavLink key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="mt-auto">
        <Link
          to="/login"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <LogOut className="size-[18px]" />
          Keluar
        </Link>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarNav />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Tutup menu"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-sidebar shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-3"
              aria-label="Tutup menu"
              onClick={() => setDrawerOpen(false)}
            >
              <X className="size-[18px]" />
            </Button>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Buka menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="size-[18px]" />
          </Button>
          <p className="truncate text-sm font-semibold sm:text-base">
            {[...primaryNav, ...secondaryNav].find((i) =>
              i.to === "/" ? pathname === "/" : pathname.startsWith(i.to),
            )?.label ?? "Griya Huffazh Quran"}
          </p>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild aria-label="Notifikasi">
              <Link to="/notifications">
                <Bell className="size-[18px]" />
              </Link>
            </Button>
            <ThemeToggle />
            <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">
              Upgrader
            </Badge>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
        <ul className="grid grid-cols-5">
          {mobileNav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
