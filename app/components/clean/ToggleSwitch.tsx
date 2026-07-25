import React from 'react';

export interface ToggleSwitchProps {
  title?: string;
}

export function ToggleSwitch({ title }: ToggleSwitchProps) {
  return <div>{title}</div>;
}
