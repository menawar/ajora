import { ReactNode } from "react";

interface TextProps {
  children: ReactNode;
  className?: string;
  variant?: "body" | "muted" | "small" | "tiny";
}

const styles = {
  body: "text-base text-gray-900",
  muted: "text-base text-gray-500",
  small: "text-sm text-gray-600",
  tiny: "text-xs text-gray-400",
};

export function Text({ children, className = "", variant = "body" }: TextProps) {
  return <p className={`${styles[variant]} ${className}`}>{children}</p>;
}
