import React from 'react';

export interface FloatingMenuProps {
  title?: string;
  className?: string;
}

export function FloatingMenu({ title = "FloatingMenu", className = "" }: FloatingMenuProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
