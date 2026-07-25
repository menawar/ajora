import React from 'react';

export interface HoverCardProps {
  title?: string;
  className?: string;
}

export function HoverCard({ title = "HoverCard", className = "" }: HoverCardProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
