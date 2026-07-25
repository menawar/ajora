import React from 'react';

export interface TokenBalanceBadgeProps {
  title?: string;
  className?: string;
}

export function TokenBalanceBadge({ title = "TokenBalanceBadge", className = "" }: TokenBalanceBadgeProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
