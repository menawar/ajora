import React from 'react';

export interface MiniPayWalletPillProps {
  title?: string;
}

export function MiniPayWalletPill({ title }: MiniPayWalletPillProps) {
  return <div>{title}</div>;
}
