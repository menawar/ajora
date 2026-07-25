import React from 'react';

export interface TokenBalanceBadgeProps {
  title?: string;
}

export function TokenBalanceBadge({ title }: TokenBalanceBadgeProps) {
  return <div>{title}</div>;
}
