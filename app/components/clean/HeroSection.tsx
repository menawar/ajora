import React from 'react';

export interface HeroSectionProps {
  title?: string;
}

export function HeroSection({ title }: HeroSectionProps) {
  return <div>{title}</div>;
}
