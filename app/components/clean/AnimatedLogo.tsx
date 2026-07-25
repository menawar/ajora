import React, { useState } from 'react';

/**
 * AnimatedLogo Props Interface
 */
export interface AnimatedLogoProps {
  /** Optional card header title */
  title?: string;
  /** Custom Tailwind CSS classes */
  className?: string;
  /** Selection action callback */
  onSelect?: () => void;
}

/**
 * AnimatedLogo component providing responsive interactive state and styling.
 */
export function AnimatedLogo({ title = "AnimatedLogo", className = "", onSelect }: AnimatedLogoProps) {
  const [active, setActive] = useState(false);
  return (
    <div data-testid="AnimatedLogo-wrapper" onClick={() => { setActive(!active); onSelect?.(); }} className={`p-4 rounded-xl border transition-all cursor-pointer ${active ? 'border-green-500 bg-green-50/50' : 'border-gray-200 bg-white'} ${className}`}>
      <h4 className="font-semibold text-gray-900">{title}</h4>
    </div>
  );
}
