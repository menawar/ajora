import React from 'react';

export interface AnimatedLogoProps {
  title?: string;
}

export function AnimatedLogo({ title }: AnimatedLogoProps) {
  return <div>{title}</div>;
}
