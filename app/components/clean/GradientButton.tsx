import React from 'react';

export interface GradientButtonProps {
  title?: string;
}

export function GradientButton({ title }: GradientButtonProps) {
  return <div>{title}</div>;
}
