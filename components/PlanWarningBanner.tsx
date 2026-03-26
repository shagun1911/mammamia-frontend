"use client";

import { usePlanWarnings } from "@/hooks/usePlanWarnings";
import { AlertTriangle, XCircle, AlertCircle, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

import { usePathname } from "next/navigation";

export function PlanWarningBanner() {
  const { data, isLoading } = usePlanWarnings();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const pathname = usePathname();

  if (isLoading || !data) {
    return null;
  }

  const { warnings, lockStatus } = data;

  // IMPORTANT: If locked, show a full-screen block unless they are on the profile/billing page
  if (lockStatus?.locked) {
    const isBillingPage = pathname?.includes('/settings/profile') || pathname?.includes('/billing');

    if (!isBillingPage) {
      return (
        <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden transform transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
            <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Service Locked</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              {lockStatus.reason || "You have reached your plan limits. All services are currently paused. Please upgrade your plan to restore access."}
            </p>
            <Link
              href="/settings/profile"
              className="block w-full py-3.5 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
            >
              Upgrade Plan Now
            </Link>
          </div>
        </div>
      );
    }

    // If they ARE on the billing page, show the persistent top banner so they can still interact with the page
    return (
      <div className="fixed top-20 left-0 right-0 z-50 mx-auto max-w-6xl px-4 animate-in slide-in-from-top duration-300">
        <div className="bg-red-600 dark:bg-red-700 border-red-800 text-white border rounded-lg px-4 py-4 shadow-2xl backdrop-blur-md relative overflow-hidden">
          {/* subtle animated background element for emphasis */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-white/10 to-red-600/0 translate-x-[-100%] animate-[shimmer_3s_infinite]" />
          
          <div className="flex items-start md:items-center flex-col md:flex-row gap-4 relative z-10">
            <div className="p-2 bg-white/20 rounded-full flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold mb-1">Service Locked</h3>
              <p className="text-sm font-medium text-white/90">
                You must upgrade your plan below to restore functionality.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal warnings (dismissible)
  if (!warnings || warnings.length === 0) {
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
