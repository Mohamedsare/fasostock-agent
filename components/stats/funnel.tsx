"use client";

import { motion } from "framer-motion";
import { formatPercent } from "@/lib/utils";

export interface FunnelStage {
  label: string;
  value: number;
  color: string;
}

/** Simple conversion funnel: each stage as a proportional bar. */
export function Funnel({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  const top = stages[0]?.value || 0;

  return (
    <div className="space-y-2.5">
      {stages.map((s, i) => (
        <div key={s.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{s.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {s.value}
              {i > 0 && top > 0 && (
                <span className="ml-1.5 text-xs">({formatPercent(s.value / top)})</span>
              )}
            </span>
          </div>
          <div className="h-7 overflow-hidden rounded-lg bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(s.value / max) * 100}%` }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="h-full rounded-lg"
              style={{ backgroundColor: s.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
