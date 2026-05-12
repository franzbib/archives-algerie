import { ReactNode } from "react";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "neutral";

interface StatusBadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
}

export function StatusBadge({ children, variant = "default", icon, className = "" }: StatusBadgeProps) {
  const baseClasses = "inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest border-2 bg-paper";
  
  const variantClasses = {
    default: "border-warm/60 text-warm",
    success: "border-emerald-800/60 text-emerald-900",
    warning: "border-amber-800/60 text-amber-900",
    error: "border-red-800/60 text-red-900",
    neutral: "border-warm/50 text-foreground",
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {icon && <span className="opacity-70">{icon}</span>}
      {children}
    </span>
  );
}
