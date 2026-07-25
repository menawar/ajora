import React from 'react';

export interface PremiumToastProps {
  title?: string;
}

export function PremiumToast({ title }: PremiumToastProps) {
  return <div>{title}</div>;
}
