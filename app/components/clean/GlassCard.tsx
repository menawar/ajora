import React from 'react';

export interface GlassCardProps {
  title?: string;
  className?: string;
}

export function GlassCard({ title = "GlassCard", className = "" }: GlassCardProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
