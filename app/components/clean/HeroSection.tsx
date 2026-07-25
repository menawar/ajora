import React, { useState } from 'react';

/**
 * HeroSection Props Interface
 */
export interface HeroSectionProps {
  /** Optional card header title */
  title?: string;
  /** Custom Tailwind CSS classes */
  className?: string;
  /** Selection action callback */
  onSelect?: () => void;
}

/**
 * HeroSection component providing responsive interactive state and styling.
 */
export function HeroSection({ title = "HeroSection", className = "", onSelect }: HeroSectionProps) {
  const [active, setActive] = useState(false);
  return (
    <div data-testid="HeroSection-wrapper" onClick={() => { setActive(!active); onSelect?.(); }} className={`p-4 rounded-xl border transition-all cursor-pointer ${active ? 'border-green-500 bg-green-50/50' : 'border-gray-200 bg-white'} ${className}`}>
      <h4 className="font-semibold text-gray-900">{title}</h4>
    </div>
  );
}
