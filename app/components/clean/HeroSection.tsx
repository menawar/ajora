import React from 'react';

export interface HeroSectionProps {
  title?: string;
  className?: string;
}

export function HeroSection({ title = "HeroSection", className = "" }: HeroSectionProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
