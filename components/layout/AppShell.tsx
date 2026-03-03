"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, Building2, BarChart3, Users, Factory,
  ChevronRight, Menu, X, Wrench, Shield, Globe, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

const NAV_MANUFACTURER = [
  { href: "/", icon: LayoutDashboard, label: "Overview" },
  { href: "/pricing", icon: TrendingUp, label: "Pricing Analysis" },
  { href: "/basis-of-design", icon: Building2, label: "Basis of Design" },
  { href: "/market-share", icon: BarChart3, label: "Market Share" },
  { href: "/engineering-firms", icon: Users, label: "Engineering Firms" },
  { href: "/manufacturers", icon: Factory, label: "Competitors" },
  { href: "/channel-partners", icon: Wrench, label: "Channel Partners" },
];

const NAV_REP = [
  { href: "/rep", icon: LayoutDashboard, label: "My Territory" },
  { href: "/rep/pipeline", icon: TrendingUp, label: "Pipeline" },
  { href: "/rep/engineering-firms", icon: Users, label: "My Firms" },
  { href: "/rep/subcontractors", icon: Wrench, label: "My Subs" },
  { href: "/rep/pricing", icon: BarChart3, label: "Local Pricing" },
  { href: "/rep/settings", icon: Shield, label: "Data Permissions" },
];

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isRepView = pathname.startsWith("/rep");

  const nav = isRepView ? NAV_REP : NAV_MANUFACTURER;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col transition-all duration-300 border-r",
        sidebarOpen ? "w-60" : "w-16"
      )} style={{ background: "var(--sidebar-bg)", borderColor: "var(--sidebar-border)" }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 min-h-[60px]" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary)" }}>
            <span className="text-white font-bold text-sm">BV</span>
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-semibold text-sm leading-tight" style={{ color: "var(--foreground)" }}>BuildVision</div>
              <div className="text-xs" style={{ color: "var(--neutral-600)" }}>Analytics</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto p-1 rounded transition-colors hover:bg-[#EDEDED]"
            style={{ color: "var(--neutral-600)" }}
          >
            {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>

        {/* View Toggle */}
        <div className={cn("p-3", !sidebarOpen && "p-2")} style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
          {sidebarOpen ? (
            <div className="flex rounded-lg p-1 gap-1" style={{ background: "var(--neutral-100)" }}>
              <Link
                href="/"
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all",
                )}
                style={!isRepView
                  ? { background: "var(--primary)", color: "#fff" }
                  : { color: "var(--neutral-600)" }
                }
              >
                <Globe size={12} /> Carrier
              </Link>
              <Link
                href="/rep"
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all",
                )}
                style={isRepView
                  ? { background: "var(--primary)", color: "#fff" }
                  : { color: "var(--neutral-600)" }
                }
              >
                <User size={12} /> Rep
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <Link href="/" className="flex justify-center p-1.5 rounded transition-colors hover:bg-[#EDEDED]"
                style={{ color: !isRepView ? "var(--primary)" : "var(--neutral-600)" }}>
                <Globe size={16} />
              </Link>
              <Link href="/rep" className="flex justify-center p-1.5 rounded transition-colors hover:bg-[#EDEDED]"
                style={{ color: isRepView ? "var(--primary)" : "var(--neutral-600)" }}>
                <User size={16} />
              </Link>
            </div>
          )}
        </div>

        {/* Context Badge */}
        {sidebarOpen && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-lg" style={{ background: "var(--neutral-100)", border: "1px solid var(--border)" }}>
            {isRepView ? (
              <div>
                <div className="text-xs" style={{ color: "var(--neutral-600)" }}>Logged in as</div>
                <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Marcus Chen</div>
                <div className="text-xs font-medium" style={{ color: "var(--primary)" }}>Northeast Territory</div>
              </div>
            ) : (
              <div>
                <div className="text-xs" style={{ color: "var(--neutral-600)" }}>Manufacturer View</div>
                <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Carrier</div>
                <div className="text-xs font-medium" style={{ color: "var(--primary)" }}>National Dashboard</div>
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
          {nav.map(({ href, icon: Icon, label }) => {
            const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all group"
                style={isActive
                  ? { background: "rgba(74,58,255,0.08)", color: "var(--primary)", fontWeight: 500 }
                  : { color: "var(--neutral-600)" }
                }
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--neutral-100)"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                <Icon size={16} className="flex-shrink-0" />
                {sidebarOpen && <span>{label}</span>}
                {sidebarOpen && isActive && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-3" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
            <div className="text-xs text-center" style={{ color: "var(--neutral-300)" }}>
              BuildVision Analytics v0.1
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto" style={{ background: "var(--background)" }}>
        {/* Top Bar */}
        <div className="sticky top-0 z-10 backdrop-blur-sm px-8 py-4 flex items-center gap-4"
          style={{ background: "rgba(255,255,255,0.85)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex-1">
            <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
              {isRepView ? "Rep View — Marcus Chen · Northeast" : "Carrier National Dashboard"}
            </div>
            <div className="text-xs" style={{ color: "var(--neutral-600)" }}>
              {isRepView ? "Your territory, your pipeline, your permissions" : "Full market intelligence across all territories"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs" style={{ color: "var(--neutral-600)" }}>Data as of</div>
            <div className="text-xs font-mono px-2 py-1 rounded" style={{ color: "var(--foreground)", background: "var(--neutral-100)", border: "1px solid var(--border)" }}>2025</div>
          </div>
        </div>

        <div className="px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div style={{ color: "var(--neutral-600)" }}>Loading...</div>
      </div>
    }>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}
