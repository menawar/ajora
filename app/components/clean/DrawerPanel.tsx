import React from 'react';

export interface DrawerPanelProps {
  title?: string;
  className?: string;
}

export function DrawerPanel({ title = "DrawerPanel", className = "" }: DrawerPanelProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
