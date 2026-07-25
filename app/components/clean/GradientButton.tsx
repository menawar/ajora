import React from 'react';

export interface GradientButtonProps {
  title?: string;
  className?: string;
}

export function GradientButton({ title = "GradientButton", className = "" }: GradientButtonProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
