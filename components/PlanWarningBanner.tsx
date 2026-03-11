"use client";

import { usePlanWarnings } from "@/hooks/usePlanWarnings";
import { AlertTriangle, XCircle, AlertCircle, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function PlanWarningBanner() {
  const { data: warnings, isLoading } = usePlanWarnings();
  const [dismissed, setDismissed] = useState<string[]>([]);

  if (isLoading || !warnings || warnings.length === 0) {
    return null;
  }


  const activeWarnings = warnings.filter(
    (w) => !dismissed.includes(`${w.type}-${w.level}`)
  );

  if (activeWarnings.length === 0) {
    return null;
  }


  const priorityOrder = { exceeded: 3, critical: 2, warning: 1 };
  const topWarning = activeWarnings.sort(
    (a, b) => priorityOrder[b.level] - priorityOrder[a.level]
  )[0];

  const handleDismiss = (warning: typeof topWarning) => {
    setDismissed([...dismissed, `${warning.type}-${warning.level}`]);
  };

  const getWarningStyle = (level: string) => {
    switch (level) {
      case "exceeded":
        return {
          bg: "bg-red-600 dark:bg-red-700 border-red-600 dark:border-red-700",
          text: "text-white",
          icon: XCircle,
        };
      case "critical":
        return {
          bg: "bg-orange-500/10 border-orange-500/30",
          text: "text-orange-600 dark:text-orange-400",
          icon: AlertTriangle,
        };
      case "warning":
        return {
          bg: "bg-yellow-500/10 border-yellow-500/30",
          text: "text-yellow-600 dark:text-yellow-400",
          icon: AlertCircle,
        };
      default:
        return {
          bg: "bg-blue-500/10 border-blue-500/30",
          text: "text-blue-600 dark:text-blue-400",
          icon: AlertCircle,
        };
    }
  };

  const style = getWarningStyle(topWarning.level);
  const Icon = style.icon;

  return (
    <div
      className={`fixed top-20 left-0 right-0 z-40 mx-auto max-w-6xl px-4 animate-in slide-in-from-top duration-300`}
    >
      <div
        className={`${style.bg} ${style.text} border rounded-lg px-4 py-3 shadow-lg backdrop-blur-sm`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 flex-shrink-0" />
          <p className="flex-1 text-sm font-medium">{topWarning.message}</p>
          <Link
            href="/settings/profile"
            className="px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            Upgrade Plan
          </Link>
          <button
            onClick={() => handleDismiss(topWarning)}
            className="p-1 hover:bg-black/10 rounded transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
