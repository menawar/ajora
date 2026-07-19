import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export interface BadgeProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles = {
  default: "bg-gray-100 text-gray-800 ring-1 ring-gray-200/50",
  success: "bg-celo-green/10 text-celo-green ring-1 ring-celo-green/20",
  warning: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  danger: "bg-red-100 text-red-800 ring-1 ring-red-200",
  info: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export function Badge({ variant = "default", size = "sm", icon, children, className = "", ...props }: BadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold shadow-sm ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </motion.div>
  );
}
