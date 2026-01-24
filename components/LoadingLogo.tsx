"use client";

import { cn } from "@/lib/utils";

interface LoadingLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  text?: string;
  className?: string;
}

export function LoadingLogo({ 
  size = "md", 
  showText = true, 
  text = "Loading...",
  className 
}: LoadingLogoProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Logo with subtle pulse animation */}
      <div className={cn("relative", sizeClasses[size])}>
        <div className="absolute inset-0 animate-pulse opacity-20">
          <div className="w-full h-full rounded-lg bg-primary blur-xl"></div>
        </div>
        <div className="relative w-full h-full flex items-center justify-center">
          <img 
            src="/Logo.webp" 
            alt="Aistein.it Logo" 
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              // Fallback to text if logo fails
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.parentElement) {
                target.parentElement.innerHTML = '<div class="w-full h-full rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">I</div>';
              }
            }}
          />
        </div>
      </div>

      {/* Loading bar */}
      <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden relative">
        <div 
          className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full absolute"
          style={{
            animation: 'shimmer 1.5s ease-in-out infinite',
            width: '60%'
          }}
        ></div>
      </div>

      {/* Loading text */}
      {showText && (
        <p className={cn("text-muted-foreground font-medium animate-pulse", textSizeClasses[size])}>
          {text}
        </p>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
            width: 20%;
          }
          50% {
            transform: translateX(0%);
            width: 60%;
          }
          100% {
            transform: translateX(100%);
            width: 20%;
          }
        }
      `}</style>
    </div>
  );
}

