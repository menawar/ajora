import React from 'react';

export interface StreakFlameIconProps {
  title?: string;
  className?: string;
}

export function StreakFlameIcon({ title = "StreakFlameIcon", className = "" }: StreakFlameIconProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
