import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    
    const variants = {
      primary: "bg-gradient-to-r from-primary to-yellow-600 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 border border-primary/50",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-white/5",
      danger: "bg-gradient-to-r from-destructive to-red-700 text-destructive-foreground shadow-lg shadow-destructive/20 hover:shadow-destructive/40 border border-destructive/50",
      ghost: "bg-transparent text-foreground hover:bg-white/5",
      outline: "bg-transparent border-2 border-border text-foreground hover:border-primary hover:text-primary",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-11 px-5 py-2 text-sm font-medium",
      lg: "h-14 px-8 text-base font-semibold",
      icon: "h-10 w-10 flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-xl transition-all duration-300 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-50 disabled:pointer-events-none disabled:transform-none",
          "active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
