import React from 'react';

export interface VaultStatusPillProps {
  title?: string;
  className?: string;
}

export function VaultStatusPill({ title = "VaultStatusPill", className = "" }: VaultStatusPillProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
