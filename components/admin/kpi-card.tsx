import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { Card } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";

export type KpiTone = "indigo" | "primary" | "accent" | "info" | "success" | "warning" | "neutral";

const TONE: Record<KpiTone, string> = {
  indigo: "bg-indigo-500/10 text-indigo-500",
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/15 text-accent",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  neutral: "bg-muted text-muted-foreground",
};

export interface KpiCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: KpiTone;
  hint?: string;
  /** Optional delta shown as a coloured pill (e.g. "+2 / 7j"). */
  delta?: { value: string; positive?: boolean };
  index?: number;
}

export function KpiCard({ label, value, icon: Icon, tone = "indigo", hint, delta, index = 0 }: KpiCardProps) {
  return (
    <FadeIn delay={index * 0.04}>
      <Card className="p-4 transition-shadow hover:shadow-md sm:p-5">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 space-y-1">
            <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground sm:text-3xl">
              {typeof value === "number" ? formatNumber(value) : value}
            </p>
            {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
          </div>
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl sm:size-11", TONE[tone])}>
            <Icon className="size-4 sm:size-5" />
          </span>
        </div>
        {delta && (
          <div className="mt-3">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                delta.positive === false
                  ? "bg-destructive/10 text-destructive"
                  : "bg-success/10 text-success",
              )}
            >
              {delta.positive === false ? (
                <ArrowDownRight className="size-3" />
              ) : (
                <ArrowUpRight className="size-3" />
              )}
              {delta.value}
            </span>
          </div>
        )}
      </Card>
    </FadeIn>
  );
}
