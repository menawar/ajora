import React, { useState } from 'react';

/**
 * DrawerPanel Props Interface
 */
export interface DrawerPanelProps {
  /** Optional card header title */
  title?: string;
  /** Custom Tailwind CSS classes */
  className?: string;
  /** Selection action callback */
  onSelect?: () => void;
}

/**
 * DrawerPanel component providing responsive interactive state and styling.
 */
export function DrawerPanel({ title = "DrawerPanel", className = "", onSelect }: DrawerPanelProps) {
  const [active, setActive] = useState(false);
  return (
    <div data-testid="DrawerPanel-wrapper" onClick={() => { setActive(!active); onSelect?.(); }} className={`p-4 rounded-xl border transition-all cursor-pointer ${active ? 'border-green-500 bg-green-50/50' : 'border-gray-200 bg-white'} ${className}`}>
      <h4 className="font-semibold text-gray-900">{title}</h4>
    </div>
  );
}
