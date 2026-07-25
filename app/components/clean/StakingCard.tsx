import React from 'react';

export interface StakingCardProps {
  title?: string;
}

export function StakingCard({ title }: StakingCardProps) {
  return <div>{title}</div>;
}
