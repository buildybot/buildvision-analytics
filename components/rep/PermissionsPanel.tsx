"use client";

import { useState } from "react";
import { Lock, Unlock, DollarSign, FileText, Swords, Users, TrendingUp, Wrench, CheckCircle } from "lucide-react";

interface Permissions {
  share_pricing: boolean | null;
  share_projects: boolean | null;
  share_competitive: boolean | null;
  share_engineering: boolean | null;
  share_pipeline: boolean | null;
  share_subcontractors: boolean | null;
}

interface Props {
  repId: number;
  manufacturerId: number;
  initialPerms: Permissions | null;
}

const PERMISSION_CONFIG = [
  {
    key: "share_pricing" as const,
    icon: DollarSign,
    title: "Pricing Data",
    description: "Share your local pricing benchmarks and deal prices with Carrier national",
    impact: "Carrier can see regional $/ton, $/CFM comparisons. Helps national pricing strategy.",
    riskLevel: "low",
  },
  {
    key: "share_projects" as const,
    icon: FileText,
    title: "Project Details",
    description: "Share specific project names, values, and outcomes with Carrier national",
    impact: "Project-level data rolls up to Carrier national dashboard. Names and values visible.",
    riskLevel: "medium",
  },
  {
    key: "share_competitive" as const,
    icon: Swords,
    title: "Competitive Intel",
    description: "Share win/loss data vs competitors in your territory",
    impact: "Carrier sees which competitors are winning against us and in what categories.",
    riskLevel: "medium",
  },
  {
    key: "share_engineering" as const,
    icon: Users,
    title: "Engineering Firm Relationships",
    description: "Share your BOD percentages and firm loyalty data with Carrier national",
    impact: "National BOD matrix includes your firms. Helps identify firm-level trends.",
    riskLevel: "low",
  },
  {
    key: "share_pipeline" as const,
    icon: TrendingUp,
    title: "Pipeline & Pending Specs",
    description: "Share pending/in-progress specs with Carrier national",
    impact: "Carrier national can see your active opportunities before they're decided.",
    riskLevel: "high",
  },
  {
    key: "share_subcontractors" as const,
    icon: Wrench,
    title: "Subcontractor Relationships",
    description: "Share your mechanical sub network and volume data with Carrier national",
    impact: "Carrier channel team can see which subs you work with and their volume.",
    riskLevel: "low",
  },
];

const RISK_COLORS: { [k: string]: string } = {
  low: "text-emerald-400 bg-emerald-400/10",
  medium: "text-amber-400 bg-amber-400/10",
  high: "text-red-400 bg-red-400/10",
};

export function PermissionsPanel({ repId, manufacturerId, initialPerms }: Props) {
  const [perms, setPerms] = useState<Permissions>({
    share_pricing: initialPerms?.share_pricing ?? true,
    share_projects: initialPerms?.share_projects ?? true,
    share_competitive: initialPerms?.share_competitive ?? true,
    share_engineering: initialPerms?.share_engineering ?? true,
    share_pipeline: initialPerms?.share_pipeline ?? false,
    share_subcontractors: initialPerms?.share_subcontractors ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = async (key: keyof Permissions) => {
    const newPerms = { ...perms, [key]: !perms[key] };
    setPerms(newPerms);
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rep_id: repId, manufacturer_id: manufacturerId, [key]: !perms[key] }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const sharedCount = Object.values(perms).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between py-3 px-4 bg-[#4A3AFF]/5 border border-[#4A3AFF]/20 rounded-lg">
        <div className="text-sm text-[#6C6C71]">
          Sharing <span className="text-[#2A2A2F] font-semibold">{sharedCount}</span> of 6 data types with Carrier national
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
            <CheckCircle size={14} />
            <span>Saved</span>
          </div>
        )}
        {saving && <div className="text-[#6C6C71] text-sm">Saving...</div>}
      </div>

      {/* Permission Toggles */}
      {PERMISSION_CONFIG.map(({ key, icon: Icon, title, description, impact, riskLevel }) => {
        const isOn = perms[key] ?? false;
        return (
          <div key={key} className={`bg-[#F8F8F8] border rounded-xl p-5 transition-all ${isOn ? "border-[#C9CBCF]" : "border-[#C9CBCF] opacity-80"}`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isOn ? "bg-[#4A3AFF]/20" : "bg-[#EDEDED]"}`}>
                <Icon size={18} className={isOn ? "text-[#4A3AFF]" : "text-[#6C6C71]"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[#2A2A2F] font-medium">{title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${RISK_COLORS[riskLevel]}`}>
                      {riskLevel} sensitivity
                    </span>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => toggle(key)}
                    className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${isOn ? "bg-[#4A3AFF]" : "bg-[#C9CBCF]"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isOn ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                <p className="text-[#6C6C71] text-sm mt-1">{description}</p>
                <div className={`mt-2 text-xs flex items-start gap-1.5 ${isOn ? "text-[#6C6C71]" : "text-[#AEB0B7]"}`}>
                  {isOn ? <Unlock size={11} className="mt-0.5 flex-shrink-0" /> : <Lock size={11} className="mt-0.5 flex-shrink-0" />}
                  <span>{isOn ? impact : "This data is hidden from Carrier national. Shows as 'Restricted'."}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="text-[#AEB0B7] text-xs text-center pt-2">
        Changes take effect immediately. Your data is never shared without your explicit consent.
      </div>
    </div>
  );
}
