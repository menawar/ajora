import React from 'react';

export interface ProgressBarProps {
  title?: string;
}

export function ProgressBar({ title }: ProgressBarProps) {
  return <div>{title}</div>;
}
