import React, { ReactNode } from "react";

interface HeadingProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
  className?: string;
  gradient?: boolean;
}

const styles = {
  1: "text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary",
  2: "text-3xl md:text-4xl font-bold tracking-tight text-text-primary",
  3: "text-2xl md:text-3xl font-semibold text-text-primary",
  4: "text-xl md:text-2xl font-semibold text-text-primary",
  5: "text-lg font-semibold text-text-primary",
  6: "text-base font-semibold text-text-primary",
};

export function Heading({ level = 2, children, className = "", gradient = false }: HeadingProps) {
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
  const baseStyle = styles[level];
  const gradientClass = gradient ? "text-gradient" : "";
  return <Tag className={`${baseStyle} ${gradientClass} ${className}`}>{children}</Tag>;
}
