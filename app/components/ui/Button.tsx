import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
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
  ({ className = "", variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={disabled ? {} : { scale: 1.02 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
        className={`rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${variantStyles[variant]} ${sizeStyles[size]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
