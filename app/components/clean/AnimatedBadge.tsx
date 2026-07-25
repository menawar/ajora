import React from 'react';

export interface AnimatedBadgeProps {
  title?: string;
  className?: string;
}

export function AnimatedBadge({ title = "AnimatedBadge", className = "" }: AnimatedBadgeProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
