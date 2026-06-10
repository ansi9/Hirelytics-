import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Briefcase, Activity, Target, Bell, Settings, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthCheck } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { data: health, isError } = useHealthCheck();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jobs", label: "Job Posted", icon: Briefcase },
    { href: "/candidates", label: "Applications", icon: Users },
    { href: "/analyze", label: "Batch Analyze", icon: Activity },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <aside className="w-[260px] bg-[#1A2035] text-white flex-col hidden md:flex shrink-0">
        <div className="h-16 px-6 flex items-center gap-3 border-b border-white/10">
          <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Target className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Shortlist.ai</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div>
            <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 px-3">Main Menu</div>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                const Icon = item.icon;
                
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer font-medium text-sm group",
                      isActive 
                        ? "bg-[#252E4B] text-white" 
                        : "text-white/70 hover:bg-[#252E4B]/50 hover:text-white"
                    )}>
                      <Icon className={cn("w-5 h-5", isActive ? "text-blue-400" : "text-white/50 group-hover:text-white/80")} />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
        
        <div className="p-4 border-t border-white/10 text-xs text-white/50">
          System: <span className={cn("font-medium", isError ? "text-red-400" : "text-emerald-400")}>
            {isError ? "Error" : health?.status === "ok" ? "Online" : "Connecting"}
          </span>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F5F7FB]">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="md:hidden flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Target className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-lg">Shortlist.ai</span>
            </div>
            
            <div className="hidden md:flex relative w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search jobs, candidates..." className="pl-9 bg-muted/50 border-none rounded-full h-10" />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden sm:block text-sm font-medium text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50">
                <Settings className="w-5 h-5" />
              </button>
              <div className="h-8 w-px bg-border mx-1"></div>
              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                <Avatar className="w-9 h-9 border">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" />
                  <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <div className="text-sm font-semibold leading-none">Admin User</div>
                  <div className="text-xs text-muted-foreground mt-1">HR Manager</div>
                </div>
              </div>
            </div>
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
