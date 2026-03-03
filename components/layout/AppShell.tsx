"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, Building2, BarChart3, Users, Factory,
  Settings, ChevronRight, Menu, X, Wrench, Shield, Globe, User
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
    <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col transition-all duration-300 border-r border-[#1f2937] bg-[#080c18]",
        sidebarOpen ? "w-60" : "w-16"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[#1f2937] min-h-[60px]">
          <div className="w-8 h-8 rounded-lg bg-[#0066ff] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">BV</span>
          </div>
          {sidebarOpen && (
            <div>
              <div className="text-white font-semibold text-sm leading-tight">BuildVision</div>
              <div className="text-[#6b7280] text-xs">Analytics</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-[#6b7280] hover:text-white p-1 rounded"
          >
            {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>

        {/* View Toggle */}
        <div className={cn("p-3 border-b border-[#1f2937]", !sidebarOpen && "p-2")}>
          {sidebarOpen ? (
            <div className="flex bg-[#111827] rounded-lg p-1 gap-1">
              <Link
                href="/"
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all",
                  !isRepView ? "bg-[#0066ff] text-white" : "text-[#9ca3af] hover:text-white"
                )}
              >
                <Globe size={12} /> Carrier
              </Link>
              <Link
                href="/rep"
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all",
                  isRepView ? "bg-[#0066ff] text-white" : "text-[#9ca3af] hover:text-white"
                )}
              >
                <User size={12} /> Rep
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <Link href="/" className={cn("flex justify-center p-1.5 rounded", !isRepView ? "text-[#0066ff]" : "text-[#6b7280] hover:text-white")}>
                <Globe size={16} />
              </Link>
              <Link href="/rep" className={cn("flex justify-center p-1.5 rounded", isRepView ? "text-[#0066ff]" : "text-[#6b7280] hover:text-white")}>
                <User size={16} />
              </Link>
            </div>
          )}
        </div>

        {/* Context Badge */}
        {sidebarOpen && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-[#111827] border border-[#1f2937]">
            {isRepView ? (
              <div>
                <div className="text-[#6b7280] text-xs">Logged in as</div>
                <div className="text-white text-sm font-medium">Marcus Chen</div>
                <div className="text-[#0066ff] text-xs">Northeast Territory</div>
              </div>
            ) : (
              <div>
                <div className="text-[#6b7280] text-xs">Manufacturer View</div>
                <div className="text-white text-sm font-medium">Carrier</div>
                <div className="text-[#0066ff] text-xs">National Dashboard</div>
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-2">
          {nav.map(({ href, icon: Icon, label }) => {
            const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                  isActive
                    ? "bg-[#0066ff]/10 text-[#0066ff] font-medium"
                    : "text-[#9ca3af] hover:text-white hover:bg-[#111827]"
                )}
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
          <div className="p-3 border-t border-[#1f2937]">
            <div className="text-[#4b5563] text-xs text-center">
              BuildVision Analytics v0.1
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-[#080c18]/80 backdrop-blur-sm border-b border-[#1f2937] px-6 py-3 flex items-center gap-4">
          <div className="flex-1">
            <div className="text-white font-medium text-sm">
              {isRepView ? "Rep View — Marcus Chen · Northeast" : "Carrier National Dashboard"}
            </div>
            <div className="text-[#6b7280] text-xs">
              {isRepView ? "Your territory, your pipeline, your permissions" : "Full market intelligence across all territories"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[#6b7280] text-xs">Data as of</div>
            <div className="text-white text-xs font-mono bg-[#111827] px-2 py-1 rounded border border-[#1f2937]">2025</div>
          </div>
        </div>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="h-screen bg-[#0a0e1a] flex items-center justify-center text-white">Loading...</div>}>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}
