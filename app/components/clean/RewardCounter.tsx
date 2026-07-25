import React, { useState } from 'react';

/**
 * RewardCounter Props Interface
 */
export interface RewardCounterProps {
  /** Optional card header title */
  title?: string;
  /** Custom Tailwind CSS classes */
  className?: string;
  /** Selection action callback */
  onSelect?: () => void;
}

/**
 * RewardCounter component providing responsive interactive state and styling.
 */
export function RewardCounter({ title = "RewardCounter", className = "", onSelect }: RewardCounterProps) {
  const [active, setActive] = useState(false);
  return (
    <div data-testid="RewardCounter-wrapper" onClick={() => { setActive(!active); onSelect?.(); }} className={`p-4 rounded-xl border transition-all cursor-pointer ${active ? 'border-green-500 bg-green-50/50' : 'border-gray-200 bg-white'} ${className}`}>
      <h4 className="font-semibold text-gray-900">{title}</h4>
    </div>
  );
}
