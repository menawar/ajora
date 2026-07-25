import React from 'react';

export interface SponsorPoolCardProps {
  title?: string;
  className?: string;
}

export function SponsorPoolCard({ title = "SponsorPoolCard", className = "" }: SponsorPoolCardProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
