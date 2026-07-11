"use client"
import Link from "next/link";
import { ROUTES } from "@/routes/routeUtils";
import { getAppName } from "@/lib/utils/config";
import React from "react";

interface LogoProps {
  showName?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ showName = true, className = "", size = "md" }: LogoProps) {
  const appName = getAppName() ?? "";
  const initial = appName.charAt(0) || "A";

  const boxSize = size === "sm" ? "w-6 h-6 rounded-md text-xs" : size === "lg" ? "w-10 h-10 rounded-xl text-base" : "w-8 h-8 rounded-lg text-sm";

  return (
    <Link href={ROUTES.PUBLIC.HOME} className={`flex items-center gap-3 transition-opacity hover:opacity-80 group-data-[collapsible=icon]:justify-center ${className}`}>
      <div className={`bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 ${boxSize} flex items-center justify-center shrink-0 shadow-sm`}>
        <span className="text-white font-bold">{initial}</span>
      </div>
      {showName && (
        <h2 className="text-lg font-semibold tracking-tight text-sidebar-foreground transition-all duration-[180ms] ease-in-out transition-delay-[40ms] truncate group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:-translate-x-2 group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:overflow-hidden">
          {appName}
        </h2>
      )}
    </Link>
  );
}
