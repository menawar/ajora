import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
}

const variantStyles = {
  primary: "bg-celo-green text-celo-dark font-bold shadow-[0_4px_14px_0_rgba(53,208,127,0.39)] hover:shadow-[0_6px_20px_rgba(53,208,127,0.23)] hover:bg-[#2ebf73]",
  secondary: "bg-bg-secondary text-text-primary hover:bg-gray-200 dark:hover:bg-gray-800",
  outline: "border-2 border-celo-green text-celo-green hover:bg-celo-green/10",
  danger: "bg-red-500 text-white shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] hover:bg-red-600 hover:shadow-[0_6px_20px_rgba(239,68,68,0.23)]",
  ghost: "bg-transparent text-text-secondary hover:bg-bg-secondary hover:text-text-primary",
};

const sizeStyles = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", icon, iconPosition = "left", isLoading = false, children, disabled, ...props }, ref) => {
    const isDisabled = disabled || isLoading;
    return (
      <motion.button
        ref={ref}
        whileHover={isDisabled ? {} : { scale: 1.03, y: -1 }}
        whileTap={isDisabled ? {} : { scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={`rounded-2xl transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celo-green focus-visible:ring-offset-2 ${variantStyles[variant]} ${sizeStyles[size]} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {icon && !isLoading && iconPosition === "left" && icon}
        {children as React.ReactNode}
        {icon && iconPosition === "right" && icon}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
