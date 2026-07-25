import React from 'react';

export interface StepIndicatorProps {
  title?: string;
  className?: string;
}

export function StepIndicator({ title = "StepIndicator", className = "" }: StepIndicatorProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
