"use client"
import React from "react";
import Logo from "@/components/Logo";

interface LoadingProps {
  fullScreen?: boolean; // if true, center and cover the screen
  text?: string;
  size?: "sm" | "md" | "lg";
}

export default function Loading({ fullScreen = true, text = "Loading...", size = "md" }: LoadingProps) {
  const styles = `
    .logo-anim{display:inline-block;position:relative;animation:logo-zoom 1.6s ease-in-out infinite}
    @keyframes logo-zoom{0%,100%{transform:scale(.96)}50%{transform:scale(1.06)}}
  `;
  if (fullScreen) {
    return (
      <>
        <style>{styles}</style>
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50 space-y-4">
          <div className="flex items-center justify-center">
            <div className="logo-anim">
              <Logo showName={false} size={size} />
            </div>
          </div>
          {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="logo-anim">
          <Logo showName={false} size={size} />
        </div>
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </>
  );
}
