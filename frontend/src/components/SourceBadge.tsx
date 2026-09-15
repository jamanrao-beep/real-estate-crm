"use client";

import React from "react";

interface SourceBadgeProps {
  source?: string | null;
  className?: string;
}

export function SourceBadge({ source, className = "" }: SourceBadgeProps) {
  const sourceStr = (source || "").trim();
  const s = sourceStr.toLowerCase();

  // Project-specific badges
  if (s.includes("fun valley") || s.includes("funvalley")) {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
        {sourceStr || "Fun Valley"}
      </span>
    );
  }

  if (s.includes("sahastradhara") || s.includes("sahastra dhara") || s.includes("sd project") || s === "sd") {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        {sourceStr || "Sahastradhara"}
      </span>
    );
  }

  if (s.includes("rani pokhari") || s.includes("ranipokhari")) {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
        {sourceStr || "Rani Pokhari"}
      </span>
    );
  }

  if (s.includes("thano")) {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        {sourceStr || "Thano"}
      </span>
    );
  }

  // Channel sources
  if (s.includes("facebook") || s.includes("meta")) {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        {sourceStr || "Facebook Lead"}
      </span>
    );
  }
  if (s.includes("sheet") || s.includes("google")) {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        {sourceStr || "Google Sheet"}
      </span>
    );
  }
  if (s.includes("excel") || s.includes("csv")) {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
        {sourceStr || "Excel Import"}
      </span>
    );
  }
  if (s.includes("whatsapp") || s.includes("chatmitra")) {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
        {sourceStr || "WhatsApp Bot"}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-bg text-ink-soft border border-border ${className}`}>
      {sourceStr || "Direct Lead"}
    </span>
  );
}

export default SourceBadge;
