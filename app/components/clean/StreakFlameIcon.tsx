import React from 'react';

export interface StreakFlameIconProps {
  title?: string;
}

export function StreakFlameIcon({ title }: StreakFlameIconProps) {
  return <div>{title}</div>;
}
