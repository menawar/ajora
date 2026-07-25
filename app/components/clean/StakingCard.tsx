import React from 'react';

export interface StakingCardProps {
  title?: string;
  className?: string;
}

export function StakingCard({ title = "StakingCard", className = "" }: StakingCardProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
