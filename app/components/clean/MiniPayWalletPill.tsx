import React, { useState } from 'react';

export interface MiniPayWalletPillProps {
  title?: string;
  className?: string;
  onSelect?: () => void;
}

export function MiniPayWalletPill({ title = "MiniPayWalletPill", className = "", onSelect }: MiniPayWalletPillProps) {
  const [active, setActive] = useState(false);
  return (
    <div data-testid="MiniPayWalletPill-wrapper" onClick={() => { setActive(!active); onSelect?.(); }} className={`p-4 rounded-xl border transition-all cursor-pointer ${active ? 'border-green-500 bg-green-50/50' : 'border-gray-200 bg-white'} ${className}`}>
      <h4 className="font-semibold text-gray-900">{title}</h4>
    </div>
  );
}
