import React, { useState } from 'react';

export interface TokenBalanceBadgeProps {
  title?: string;
  className?: string;
  onSelect?: () => void;
}

export function TokenBalanceBadge({ title = "TokenBalanceBadge", className = "", onSelect }: TokenBalanceBadgeProps) {
  const [active, setActive] = useState(false);
  return (
    <div onClick={() => { setActive(!active); onSelect?.(); }} className={`p-4 rounded-xl border transition-all cursor-pointer ${active ? 'border-green-500 bg-green-50/50' : 'border-gray-200 bg-white'} ${className}`}>
      <h4 className="font-semibold text-gray-900">{title}</h4>
    </div>
  );
}
