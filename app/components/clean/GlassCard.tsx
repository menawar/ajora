import React, { useState } from 'react';

/**
 * GlassCard Props Interface
 */
export interface GlassCardProps {
  /** Optional card header title */
  title?: string;
  /** Custom Tailwind CSS classes */
  className?: string;
  /** Selection action callback */
  onSelect?: () => void;
}

/**
 * GlassCard component providing responsive interactive state and styling.
 */
export function GlassCard({ title = "GlassCard", className = "", onSelect }: GlassCardProps) {
  const [active, setActive] = useState(false);
  return (
    <div data-testid="GlassCard-wrapper" onClick={() => { setActive(!active); onSelect?.(); }} className={`p-4 rounded-xl border transition-all cursor-pointer ${active ? 'border-green-500 bg-green-50/50' : 'border-gray-200 bg-white'} ${className}`}>
      <h4 className="font-semibold text-gray-900">{title}</h4>
    </div>
  );
}
