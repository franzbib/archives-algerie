import { ReactNode } from "react";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "neutral";

interface StatusBadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
}

export function StatusBadge({ children, variant = "default", icon, className = "" }: StatusBadgeProps) {
  const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-xs uppercase tracking-wider border";
  
  const variantClasses = {
    default: "border-paper-border bg-paper text-foreground",
    success: "border-green-200 bg-green-50 text-green-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-red-200 bg-red-50 text-red-800",
    neutral: "border-stone-200 bg-stone-100 text-stone-600",
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {icon && <span className="opacity-70">{icon}</span>}
      {children}
    </span>
  );
}
