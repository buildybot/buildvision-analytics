import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  color?: "blue" | "green" | "amber" | "red" | "purple";
  className?: string;
}

const colorMap = {
  blue:   { icon: "#4A3AFF", bg: "rgba(74,58,255,0.08)",   border: "rgba(74,58,255,0.2)" },
  green:  { icon: "#16DA7C", bg: "rgba(22,218,124,0.10)",  border: "rgba(22,218,124,0.25)" },
  amber:  { icon: "#FFCC17", bg: "rgba(255,204,23,0.12)",  border: "rgba(255,204,23,0.3)" },
  red:    { icon: "#EC4343", bg: "rgba(236,67,67,0.10)",   border: "rgba(236,67,67,0.25)" },
  purple: { icon: "#CC98F6", bg: "rgba(204,152,246,0.10)", border: "rgba(204,152,246,0.25)" },
};

export function KpiCard({ label, value, sub, icon: Icon, trend, color = "blue", className }: KpiCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn("rounded-xl p-5 flex flex-col gap-3", className)}
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--neutral-600)" }}>{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: c.bg, border: `1px solid ${c.border}` }}>
            <Icon size={16} style={{ color: c.icon }} />
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>{value}</div>
        {sub && <div className="text-xs mt-1" style={{ color: "var(--neutral-600)" }}>{sub}</div>}
      </div>
      {trend && (
        <div className="text-xs font-medium flex items-center gap-1"
          style={{ color: trend.value >= 0 ? "#16DA7C" : "#EC4343" }}>
          <span>{trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%</span>
          <span className="font-normal" style={{ color: "var(--neutral-600)" }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
