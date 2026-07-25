import React from 'react';

export interface QuestBadgeProps {
  title?: string;
  className?: string;
}

export function QuestBadge({ title = "QuestBadge", className = "" }: QuestBadgeProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
