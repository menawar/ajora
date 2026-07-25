import React from 'react';

export interface PulseRingProps {
  title?: string;
  className?: string;
}

export function PulseRing({ title = "PulseRing", className = "" }: PulseRingProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
