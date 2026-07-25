import React from 'react';

export interface StatWidgetProps {
  title?: string;
  className?: string;
}

export function StatWidget({ title = "StatWidget", className = "" }: StatWidgetProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
