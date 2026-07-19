import { HTMLAttributes, forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export interface CardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  variant?: "default" | "glass" | "bordered";
}

const variantStyles = {
  default: "bg-bg-primary shadow-md border border-gray-100 dark:border-gray-800",
  glass: "glass-panel shadow-sm border border-white/20 dark:border-white/10",
  bordered: "border-2 border-gray-200 dark:border-gray-800 bg-transparent",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", variant = "default", interactive = false, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={interactive ? { y: -2, scale: 1.01 } : undefined}
        whileTap={interactive ? { scale: 0.98 } : undefined}
        className={`rounded-2xl p-4 sm:p-5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celo-green focus-visible:ring-offset-2 ${interactive ? "cursor-pointer hover:shadow-lg" : ""} ${variantStyles[variant]} ${className}`}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Card.displayName = "Card";
