import React from 'react';

export interface PremiumToastProps {
  title?: string;
  className?: string;
}

export function PremiumToast({ title = "PremiumToast", className = "" }: PremiumToastProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
