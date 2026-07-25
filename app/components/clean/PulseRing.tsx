import React, { useState } from 'react';

export interface PulseRingProps {
  title?: string;
  className?: string;
  onSelect?: () => void;
}

export function PulseRing({ title = "PulseRing", className = "", onSelect }: PulseRingProps) {
  const [active, setActive] = useState(false);
  return (
    <div data-testid="PulseRing-wrapper" onClick={() => { setActive(!active); onSelect?.(); }} className={`p-4 rounded-xl border transition-all cursor-pointer ${active ? 'border-green-500 bg-green-50/50' : 'border-gray-200 bg-white'} ${className}`}>
      <h4 className="font-semibold text-gray-900">{title}</h4>
    </div>
  );
}
