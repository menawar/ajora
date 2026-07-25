import React from 'react';

export interface ShimmerTextProps {
  title?: string;
}

export function ShimmerText({ title }: ShimmerTextProps) {
  return <div>{title}</div>;
}
