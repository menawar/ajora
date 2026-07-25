import React from 'react';

export interface ToggleSwitchProps {
  title?: string;
  className?: string;
}

export function ToggleSwitch({ title = "ToggleSwitch", className = "" }: ToggleSwitchProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
