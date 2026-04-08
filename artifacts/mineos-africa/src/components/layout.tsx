import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useListAlerts } from "@workspace/api-client-react";
import {
  LayoutDashboard,
  Map,
  Folders,
  Mountain,
  Box,
  TrendingUp,
  AlertTriangle,
  Users,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // Add dark mode class by default
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const { data: alerts } = useListAlerts({ status: "active" });
  const activeAlertCount = alerts?.length || 0;

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Mine Map", href: "/map", icon: Map },
    { name: "Projects", href: "/projects", icon: Folders },
    { name: "Surveys", href: "/surveys", icon: Mountain },
    { name: "Volumes", href: "/volumes", icon: Box },
    { name: "Production", href: "/production", icon: TrendingUp },
    { 
      name: "Safety Alerts", 
      href: "/alerts", 
      icon: AlertTriangle,
      badge: activeAlertCount > 0 ? activeAlertCount : null
    },
    { name: "Users", href: "/users", icon: Users },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 font-mono text-xl font-bold tracking-tight">
            <div className="w-3 h-3 bg-primary" />
            MineOS<span className="text-primary">.</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className={`mr-3 flex-shrink-0 h-4 w-4 ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      {item.name}
                    </div>
                    {item.badge && (
                      <Badge variant="destructive" className="ml-auto flex-shrink-0 h-5 px-1.5 min-w-[20px] flex items-center justify-center rounded-sm text-[10px]">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-mono font-bold">
              OP
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Operator 01</p>
              <p className="text-xs text-muted-foreground truncate">Main Console</p>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
