import React from 'react';

export interface TabNavProps {
  title?: string;
  className?: string;
}

export function TabNav({ title = "TabNav", className = "" }: TabNavProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
