import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function RestrictedBadge({ label, className }: { label?: string; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-2 py-0.5",
      className
    )}>
      <Lock size={10} />
      {label ?? "Restricted"}
    </span>
  );
}

export function RestrictedBlock({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-amber-400/70 text-sm bg-amber-400/5 border border-amber-400/20 rounded-lg px-4 py-3">
      <Lock size={14} />
      <span>{message}</span>
    </div>
  );
}
