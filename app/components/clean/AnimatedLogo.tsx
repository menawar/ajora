import React from 'react';

export interface AnimatedLogoProps {
  title?: string;
  className?: string;
}

export function AnimatedLogo({ title = "AnimatedLogo", className = "" }: AnimatedLogoProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
