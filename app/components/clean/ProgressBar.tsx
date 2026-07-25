import React from 'react';

export interface ProgressBarProps {
  title?: string;
  className?: string;
}

export function ProgressBar({ title = "ProgressBar", className = "" }: ProgressBarProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
