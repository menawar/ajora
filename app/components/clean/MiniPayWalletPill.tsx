import React from 'react';

export interface MiniPayWalletPillProps {
  title?: string;
  className?: string;
}

export function MiniPayWalletPill({ title = "MiniPayWalletPill", className = "" }: MiniPayWalletPillProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
