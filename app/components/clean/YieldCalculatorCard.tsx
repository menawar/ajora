import React from 'react';

export interface YieldCalculatorCardProps {
  title?: string;
  className?: string;
}

export function YieldCalculatorCard({ title = "YieldCalculatorCard", className = "" }: YieldCalculatorCardProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
