import { HTMLAttributes } from "react";
import { motion } from "framer-motion";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "circular" | "rectangular" | "text";
}

const variantStyles = {
  circular: "rounded-full",
  rectangular: "rounded-2xl",
  text: "rounded-md",
};

export function Skeleton({ className = "", variant = "rectangular", ...props }: SkeletonProps) {
  return (
    <motion.div
      className={`bg-bg-secondary ${variantStyles[variant]} ${className}`}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      {...(props as any)}
    />
  );
}
