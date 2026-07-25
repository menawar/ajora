import React from 'react';

export interface PulseRingProps {
  title?: string;
}

export function PulseRing({ title }: PulseRingProps) {
  return <div>{title}</div>;
}
