import React from 'react';

export interface RewardCounterProps {
  title?: string;
  className?: string;
}

export function RewardCounter({ title = "RewardCounter", className = "" }: RewardCounterProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
