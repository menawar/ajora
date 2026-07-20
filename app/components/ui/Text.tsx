import { ReactNode } from "react";

interface TextProps {
  children: ReactNode;
  className?: string;
  variant?: "body" | "muted" | "small" | "tiny";
}

const styles = {
  body: "text-base md:text-lg text-text-primary leading-relaxed",
  muted: "text-base text-text-muted",
  small: "text-sm text-text-secondary",
  tiny: "text-xs text-text-muted",
};

export function Text({ children, className = "", variant = "body" }: TextProps) {
  return <p className={`${styles[variant]} ${className}`}>{children}</p>;
}
