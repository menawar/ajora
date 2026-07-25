import React from 'react';

export interface YieldCalculatorCardProps {
  title?: string;
}

export function YieldCalculatorCard({ title }: YieldCalculatorCardProps) {
  return <div>{title}</div>;
}
