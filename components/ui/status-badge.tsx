import { cn } from "@/lib/utils";

const STATUS_STYLES: { [k: string]: string } = {
  won: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  lost: "text-red-400 bg-red-400/10 border-red-400/20",
  pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  primary: "text-[#0066ff] bg-[#0066ff]/10 border-[#0066ff]/20",
  secondary: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  occasional: "text-[#9ca3af] bg-[#9ca3af]/10 border-[#9ca3af]/20",
  large: "text-white bg-[#1f2937] border-[#374151]",
  mid: "text-[#9ca3af] bg-[#111827] border-[#1f2937]",
  small: "text-[#6b7280] bg-[#0a0e1a] border-[#1f2937]",
  mechanical: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  plumbing: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  sheet_metal: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  controls: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center text-xs font-medium border rounded px-2 py-0.5 capitalize",
      STATUS_STYLES[value] ?? "text-[#9ca3af] bg-[#1f2937] border-[#374151]",
      className
    )}>
      {value.replace("_", " ")}
    </span>
  );
}
