import React from 'react';

export interface StepIndicatorProps {
  title?: string;
}

export function StepIndicator({ title }: StepIndicatorProps) {
  return <div>{title}</div>;
}
