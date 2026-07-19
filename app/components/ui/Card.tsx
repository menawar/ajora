import { HTMLAttributes, forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export interface CardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  variant?: "default" | "glass" | "bordered";
}

const variantStyles = {
  default: "bg-white shadow-md border border-gray-100",
  glass: "glass-panel shadow-sm border border-white/20",
  bordered: "border-2 border-gray-200 bg-transparent",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", variant = "default", children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={`rounded-2xl p-4 sm:p-5 ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Card.displayName = "Card";
