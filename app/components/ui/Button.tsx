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
  primary: "bg-celo-green text-white shadow-md shadow-celo-green/20 hover:shadow-lg hover:shadow-celo-green/30",
  secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  outline: "border-2 border-celo-green text-celo-green hover:bg-celo-green/10",
  danger: "bg-red-500 text-white hover:bg-red-600",
  ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-base",
  lg: "px-6 py-3.5 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", icon, iconPosition = "left", isLoading = false, children, disabled, ...props }, ref) => {
    const isDisabled = disabled || isLoading;
    return (
      <motion.button
        ref={ref}
        whileHover={isDisabled ? {} : { scale: 1.02 }}
        whileTap={isDisabled ? {} : { scale: 0.98 }}
        className={`rounded-xl font-semibold transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celo-green focus-visible:ring-offset-2 ${variantStyles[variant]} ${sizeStyles[size]} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
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
