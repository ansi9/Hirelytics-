import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Briefcase, Activity, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck } from "@workspace/api-client-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { data: health, isError } = useHealthCheck();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jobs", label: "Jobs", icon: Briefcase },
    { href: "/candidates", label: "Candidates", icon: Users },
    { href: "/analyze", label: "Batch Analyze", icon: Activity },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r bg-card flex flex-col hidden md:flex">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded flex items-center justify-center">
            <ShieldCheck className="text-primary-foreground w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">Shortlist.ai</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all cursor-pointer font-medium text-sm group",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}>
                  <Icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t text-xs text-muted-foreground font-mono">
          System Status: <span className={cn("font-bold", isError ? "text-red-500" : "text-emerald-600")}>
            {isError ? "ERROR" : health?.status === "ok" ? "ONLINE" : "CONNECTING"}
          </span>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b bg-card flex items-center px-6 md:hidden">
          <div className="h-8 w-8 bg-primary rounded flex items-center justify-center mr-3">
            <ShieldCheck className="text-primary-foreground w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg">Shortlist.ai</span>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
