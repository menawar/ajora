import React from 'react';

export interface RewardCounterProps {
  title?: string;
}

export function RewardCounter({ title }: RewardCounterProps) {
  return <div>{title}</div>;
}
