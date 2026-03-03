import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-6", className)}>
      <div>
        <h2 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>{title}</h2>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: "var(--neutral-600)" }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
