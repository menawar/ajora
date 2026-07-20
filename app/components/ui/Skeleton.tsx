import { HTMLAttributes } from "react";
import { motion } from "framer-motion";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "circular" | "rectangular" | "text";
}

const variantStyles = {
  circular: "rounded-full",
  rectangular: "rounded-xl",
  text: "rounded-md",
};

export function Skeleton({ className = "", variant = "rectangular", ...props }: SkeletonProps) {
  return (
    <motion.div
      className={`bg-gray-200 dark:bg-gray-800 ${variantStyles[variant]} ${className}`}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      {...(props as any)}
    />
  );
}
