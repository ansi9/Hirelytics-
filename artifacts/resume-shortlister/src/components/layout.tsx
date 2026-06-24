import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, Briefcase, Activity,
  Bell, Search, BarChart2, BookMarked, TrendingUp,
  FileText, Moon, Sun, Shield, UserCog, HelpCircle,
  LogOut, Github, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface LayoutProps {
  children: React.ReactNode;
}

const mainNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Job Postings", icon: Briefcase },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/analyze", label: "Batch Analyze", icon: Activity },
  { href: "/jobs", label: "Shortlisted", icon: BookMarked },
  { href: "/candidates", label: "Analytics", icon: BarChart2 },
];

const reportNav = [
  { href: "/analyze", label: "Insights", icon: TrendingUp },
  { href: "/jobs", label: "Pipeline View", icon: FileText },
];

const settingsNav = [
  { label: "Profile", icon: UserCog },
  { label: "Notifications", icon: Bell },
  { label: "Security", icon: Shield },
  { label: "Help", icon: HelpCircle },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { data: health, isError } = useHealthCheck();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  const NavItem = ({
    href, label, icon: Icon,
  }: { href?: string; label: string; icon: React.ComponentType<{ className?: string }> }) => {
    const active = href ? isActive(href) : false;
    const inner = (
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all cursor-pointer",
          active
            ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]"
            : "text-[hsl(var(--sidebar-foreground)/60%)] hover:text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent)/60%)]"
        )}
      >
        <Icon className={cn("w-[15px] h-[15px] shrink-0", active ? "text-[hsl(var(--sidebar-primary))]" : "opacity-70")} />
        <span>{label}</span>
        {active && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[hsl(var(--sidebar-primary))]" />
        )}
      </div>
    );

    return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
  };

  const onlineStatus = isError ? "Offline" : health?.status === "ok" ? "Online" : "Connecting";
  const statusDot = isError ? "bg-red-400" : health?.status === "ok" ? "bg-emerald-400" : "bg-amber-400";

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* ── SIDEBAR ── */}
      <aside
        className="w-[240px] flex-col hidden md:flex shrink-0 fixed top-0 left-0 h-screen z-20 overflow-y-auto"
        style={{
          background: "hsl(var(--sidebar))",
          borderRight: "1px solid hsl(var(--sidebar-border))",
        }}
      >
        {/* Wordmark */}
        <div
          className="h-14 px-4 flex items-center gap-2.5 shrink-0"
          style={{ borderBottom: "1px solid hsl(var(--sidebar-border))" }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "hsl(var(--sidebar-primary))" }}
          >
            <Layers className="w-3.5 h-3.5" style={{ color: "hsl(var(--sidebar-primary-foreground))" }} />
          </div>
          <span
            className="font-semibold text-[15px] tracking-tight"
            style={{ color: "hsl(var(--sidebar-foreground))" }}
          >
            Hirelytics
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.08em] px-3 mb-1.5"
              style={{ color: "hsl(var(--sidebar-foreground)/30%)" }}
            >
              Main
            </p>
            <div className="space-y-0.5">
              {mainNav.map((item) => (
                <NavItem key={item.href + item.label} href={item.href} label={item.label} icon={item.icon} />
              ))}
            </div>
          </div>

          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.08em] px-3 mb-1.5"
              style={{ color: "hsl(var(--sidebar-foreground)/30%)" }}
            >
              Reports
            </p>
            <div className="space-y-0.5">
              {reportNav.map((item) => (
                <NavItem key={item.href + item.label} href={item.href} label={item.label} icon={item.icon} />
              ))}
            </div>
          </div>

          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.08em] px-3 mb-1.5"
              style={{ color: "hsl(var(--sidebar-foreground)/30%)" }}
            >
              Settings
            </p>
            <div className="space-y-0.5">
              {settingsNav.map((item) => (
                <NavItem key={item.label} label={item.label} icon={item.icon} />
              ))}

              {/* Theme toggle row */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all hover:bg-[hsl(var(--sidebar-accent)/60%)]"
                style={{ color: "hsl(var(--sidebar-foreground)/60%)" }}
                data-testid="toggle-dark-mode"
              >
                {darkMode ? (
                  <Moon className="w-[15px] h-[15px] opacity-70 shrink-0" />
                ) : (
                  <Sun className="w-[15px] h-[15px] opacity-70 shrink-0" />
                )}
                <span>{darkMode ? "Dark mode" : "Light mode"}</span>
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--sidebar-accent))]" style={{ color: "hsl(var(--sidebar-primary))" }}>
                  {darkMode ? "ON" : "OFF"}
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div
          className="px-3 py-3 shrink-0 space-y-2"
          style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}
        >
          <a
            href="https://github.com/ansi9/Hirelytics-"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md transition-all hover:bg-[hsl(var(--sidebar-accent)/60%)]"
          >
            <Github className="w-[15px] h-[15px] shrink-0 opacity-60" style={{ color: "hsl(var(--sidebar-foreground))" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold truncate" style={{ color: "hsl(var(--sidebar-foreground)/80%)" }}>
                ansi9/Hirelytics-
              </p>
              <p className="text-[10px] truncate" style={{ color: "hsl(var(--sidebar-foreground)/40%)" }}>
                View source on GitHub
              </p>
            </div>
          </a>

          <div className="flex items-center gap-2.5 px-3 py-2">
            <Avatar className="w-7 h-7 border shrink-0" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" />
              <AvatarFallback className="text-[10px]">AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold truncate" style={{ color: "hsl(var(--sidebar-foreground))" }}>
                Admin
              </p>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot}`} />
                <p className="text-[10px] truncate" style={{ color: "hsl(var(--sidebar-foreground)/40%)" }}>
                  {onlineStatus}
                </p>
              </div>
            </div>
            <LogOut
              className="w-3.5 h-3.5 shrink-0 opacity-30 hover:opacity-60 cursor-pointer transition-opacity"
              style={{ color: "hsl(var(--sidebar-foreground))" }}
            />
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-[240px]">
        {/* Header */}
        <header
          className="h-14 border-b flex items-center justify-between px-5 shrink-0 sticky top-0 z-10"
          style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
        >
          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-2">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(var(--primary))" }}
            >
              <Layers className="text-white w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm">Hirelytics</span>
          </div>

          {/* Desktop search */}
          <div className="hidden md:flex relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs, candidates…"
              className="pl-9 h-8 text-sm rounded-full border-transparent bg-muted/50 focus:border-border focus:bg-background transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-muted-foreground tabular-nums">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>

            <button
              className="relative p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-[17px] h-[17px]" />
              <span
                className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"
              />
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              data-testid="button-header-theme-toggle"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="w-[17px] h-[17px]" /> : <Moon className="w-[17px] h-[17px]" />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-5 md:p-7">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
