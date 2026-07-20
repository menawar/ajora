import React, { ReactNode } from "react";

interface HeadingProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
  className?: string;
}

const styles = {
  1: "text-3xl font-extrabold tracking-tight text-gray-900",
  2: "text-2xl font-bold tracking-tight text-gray-900",
  3: "text-xl font-semibold text-gray-900",
  4: "text-lg font-semibold text-gray-900",
  5: "text-base font-semibold text-gray-900",
  6: "text-sm font-semibold text-gray-900",
};

export function Heading({ level = 2, children, className = "" }: HeadingProps) {
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
  return <Tag className={`${styles[level]} ${className}`}>{children}</Tag>;
}
