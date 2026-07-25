import React from 'react';

export interface LeaderboardRowProps {
  title?: string;
  className?: string;
}

export function LeaderboardRow({ title = "LeaderboardRow", className = "" }: LeaderboardRowProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
