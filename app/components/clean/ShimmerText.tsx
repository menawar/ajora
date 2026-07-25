import React from 'react';

export interface ShimmerTextProps {
  title?: string;
  className?: string;
}

export function ShimmerText({ title = "ShimmerText", className = "" }: ShimmerTextProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
