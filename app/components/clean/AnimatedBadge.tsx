import React from 'react';

export interface AnimatedBadgeProps {
  title?: string;
}

export function AnimatedBadge({ title }: AnimatedBadgeProps) {
  return <div>{title}</div>;
}
