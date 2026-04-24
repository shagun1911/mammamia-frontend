"use client";
import { WidgetLinkGenerator } from "./WidgetLinkGenerator";

export function InstallationGuide() {
  return (
    <div className="bg-card p-8">
      <h2 className="text-xl font-bold text-foreground mb-6">Installation</h2>
      <WidgetLinkGenerator />
    </div>
  );
}

