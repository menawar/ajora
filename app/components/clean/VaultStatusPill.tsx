import React from 'react';

export interface VaultStatusPillProps {
  title?: string;
}

export function VaultStatusPill({ title }: VaultStatusPillProps) {
  return <div>{title}</div>;
}
