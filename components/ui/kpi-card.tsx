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
  blue: { icon: "text-[#0066ff]", bg: "bg-[#0066ff]/10", border: "border-[#0066ff]/20" },
  green: { icon: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
  amber: { icon: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  red: { icon: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
  purple: { icon: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
};

export function KpiCard({ label, value, sub, icon: Icon, trend, color = "blue", className }: KpiCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn(
      "bg-[#111827] border border-[#1f2937] rounded-xl p-5 flex flex-col gap-3",
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-[#9ca3af] text-sm">{label}</span>
        {Icon && (
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", c.bg, "border", c.border)}>
            <Icon size={16} className={c.icon} />
          </div>
        )}
      </div>
      <div>
        <div className="text-white text-2xl font-bold tracking-tight">{value}</div>
        {sub && <div className="text-[#6b7280] text-xs mt-1">{sub}</div>}
      </div>
      {trend && (
        <div className={cn(
          "text-xs font-medium flex items-center gap-1",
          trend.value >= 0 ? "text-emerald-400" : "text-red-400"
        )}>
          <span>{trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%</span>
          <span className="text-[#6b7280] font-normal">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
