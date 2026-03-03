import { cn } from "@/lib/utils";

const STATUS_STYLES: { [k: string]: { color: string; bg: string; border: string } } = {
  won:        { color: "#16DA7C", bg: "#B2FFDA", border: "rgba(22,218,124,0.4)" },
  lost:       { color: "#EC4343", bg: "#FFDADA", border: "rgba(236,67,67,0.4)" },
  pending:    { color: "#B08A00", bg: "#FFECAA", border: "rgba(255,204,23,0.5)" },
  primary:    { color: "#4A3AFF", bg: "rgba(74,58,255,0.08)", border: "rgba(74,58,255,0.2)" },
  secondary:  { color: "#CC98F6", bg: "rgba(204,152,246,0.1)", border: "rgba(204,152,246,0.25)" },
  occasional: { color: "#6C6C71", bg: "#EDEDED", border: "#C9CBCF" },
  large:      { color: "#2A2A2F", bg: "#EDEDED", border: "#C9CBCF" },
  mid:        { color: "#6C6C71", bg: "#F8F8F8", border: "#C9CBCF" },
  small:      { color: "#AEB0B7", bg: "#FFFFFF", border: "#C9CBCF" },
  mechanical: { color: "#4A3AFF", bg: "rgba(74,58,255,0.08)", border: "rgba(74,58,255,0.2)" },
  plumbing:   { color: "#0EA5E9", bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.2)" },
  sheet_metal:{ color: "#F97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)" },
  controls:   { color: "#CC98F6", bg: "rgba(204,152,246,0.1)", border: "rgba(204,152,246,0.25)" },
};

const DEFAULT_STYLE = { color: "#6C6C71", bg: "#EDEDED", border: "#C9CBCF" };

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  const s = STATUS_STYLES[value] ?? DEFAULT_STYLE;
  return (
    <span
      className={cn("inline-flex items-center text-xs font-medium rounded px-2 py-0.5 capitalize", className)}
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {value.replace("_", " ")}
    </span>
  );
}
