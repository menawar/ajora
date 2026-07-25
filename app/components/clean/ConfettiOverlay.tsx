import React from 'react';

export interface ConfettiOverlayProps {
  title?: string;
  className?: string;
}

export function ConfettiOverlay({ title = "ConfettiOverlay", className = "" }: ConfettiOverlayProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
