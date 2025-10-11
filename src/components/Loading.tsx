"use client"
import React from "react";
import Logo from "@/components/Logo";

interface LoadingProps {
  fullScreen?: boolean; // if true, center and cover the screen
  text?: string;
  size?: "sm" | "md" | "lg";
}

export default function Loading({ fullScreen = true, text = "Loading...", size = "md" }: LoadingProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50 space-y-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin">
            <Logo showName={false} size={size} />
          </div>
        </div>
        {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="animate-spin">
        <Logo showName={false} size={size} />
      </div>
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
