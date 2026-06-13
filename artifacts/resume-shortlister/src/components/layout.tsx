import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, Briefcase, Activity, Target, Bell,
  Settings, Search, BarChart2, BookMarked, TrendingUp, FileText,
  Moon, Sun, Shield, UserCog, HelpCircle, LogOut, ChevronRight, Github
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { data: health, isError } = useHealthCheck();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
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

  const mainNavItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jobs", label: "Job Posted", icon: Briefcase },
    { href: "/candidates", label: "Applications", icon: Users },
    { href: "/analyze", label: "Batch Analyze", icon: Activity },
    { href: "/jobs", label: "Shortlisted", icon: BookMarked },
    { href: "/candidates", label: "Analytics", icon: BarChart2 },
  ];

  const reportItems = [
    { href: "/analyze", label: "Insights", icon: TrendingUp },
    { href: "/jobs", label: "Pipeline View", icon: FileText },
  ];

  const settingsItems = [
    { label: "Profile Settings", icon: UserCog },
    { label: "Notifications", icon: Bell },
    { label: "Security", icon: Shield },
    { label: "Help & Support", icon: HelpCircle },
  ];

  const SidebarItem = ({ href, label, icon: Icon, onClick }: { href?: string; label: string; icon: any; onClick?: () => void }) => {
    const isActive = href ? (location === href || (href !== "/" && location.startsWith(href))) : false;
    const inner = (
      <div className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer font-medium text-sm group",
        isActive
          ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]"
          : "text-[hsl(var(--sidebar-foreground)/70%)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]"
      )}>
        <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[hsl(var(--sidebar-primary))]" : "opacity-60 group-hover:opacity-100")} />
        <span className="flex-1">{label}</span>
        {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
      </div>
    );

    if (href) {
      return <Link href={href}>{inner}</Link>;
    }
    return <div onClick={onClick}>{inner}</div>;
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* ── SIDEBAR ── */}
      <aside className="w-[260px] flex-col hidden md:flex shrink-0 fixed top-0 left-0 h-screen z-20 overflow-y-auto"
        style={{ background: "hsl(var(--sidebar))", borderRight: "1px solid hsl(var(--sidebar-border))" }}>

        {/* Logo */}
        <div className="h-16 px-5 flex items-center gap-3 shrink-0" style={{ borderBottom: "1px solid hsl(var(--sidebar-border))" }}>
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--sidebar-primary))" }}>
            <Target className="w-4 h-4" style={{ color: "hsl(var(--sidebar-primary-foreground))" }} />
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: "hsl(var(--sidebar-foreground))" }}>Hirelytics</span>
        </div>

        {/* Main Menu */}
        <nav className="flex-1 px-3 py-4 space-y-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: "hsl(var(--sidebar-foreground)/40%)" }}>Main Menu</div>
            <div className="space-y-0.5">
              {mainNavItems.map((item) => (
                <SidebarItem key={item.href + item.label} href={item.href} label={item.label} icon={item.icon} />
              ))}
            </div>
          </div>

          {/* Reports */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: "hsl(var(--sidebar-foreground)/40%)" }}>Reports</div>
            <div className="space-y-0.5">
              {reportItems.map((item) => (
                <SidebarItem key={item.href + item.label} href={item.href} label={item.label} icon={item.icon} />
              ))}
            </div>
          </div>

          {/* Settings */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: "hsl(var(--sidebar-foreground)/40%)" }}>Settings</div>
            <div className="space-y-0.5">
              {settingsItems.map((item) => (
                <SidebarItem key={item.label} label={item.label} icon={item.icon} />
              ))}

              {/* Dark / Light mode toggle */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{ background: "hsl(var(--sidebar-accent))" }}>
                {darkMode ? (
                  <Moon className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--sidebar-primary))" }} />
                ) : (
                  <Sun className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--sidebar-primary))" }} />
                )}
                <span className="flex-1 text-sm font-medium" style={{ color: "hsl(var(--sidebar-foreground))" }}>
                  {darkMode ? "Dark Mode" : "Light Mode"}
                </span>
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  data-testid="toggle-dark-mode"
                  className="scale-90"
                />
              </div>
            </div>
          </div>
        </nav>

        {/* Footer: GitHub + user + status */}
        <div className="px-3 pb-4 pt-2 shrink-0 space-y-2" style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}>
          <a
            href="https://github.com/ansi9/Hirelytics-"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:opacity-80"
            style={{ background: "hsl(var(--sidebar-accent))" }}
          >
            <Github className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--sidebar-primary))" }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: "hsl(var(--sidebar-foreground))" }}>ansi9/Hirelytics-</div>
              <div className="text-[10px] truncate" style={{ color: "hsl(var(--sidebar-foreground)/50%)" }}>github.com</div>
            </div>
          </a>

          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="w-8 h-8 border" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: "hsl(var(--sidebar-foreground))" }}>Admin User</div>
              <div className="text-xs truncate" style={{ color: "hsl(var(--sidebar-foreground)/50%)" }}>
                {isError ? "⚠ Offline" : health?.status === "ok" ? "● Online" : "● Connecting"}
              </div>
            </div>
            <LogOut className="w-4 h-4 shrink-0 opacity-40 hover:opacity-80 cursor-pointer transition-opacity" style={{ color: "hsl(var(--sidebar-foreground))" }} />
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-[260px]">
        {/* Top Header */}
        <header className="h-16 border-b flex items-center justify-between px-6 shrink-0 sticky top-0 z-10"
          style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
          <div className="flex items-center gap-4">
            {/* Mobile logo */}
            <div className="md:hidden flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
                <Target className="text-white w-4 h-4" />
              </div>
              <span className="font-bold text-lg">Hirelytics</span>
            </div>

            <div className="hidden md:flex relative w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search jobs, candidates..." className="pl-9 rounded-full h-9 text-sm border-none bg-muted/60" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-sm font-medium text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2" style={{ borderColor: "hsl(var(--card))" }}></span>
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50"
              data-testid="button-header-theme-toggle"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="mx-auto max-w-[1400px]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
