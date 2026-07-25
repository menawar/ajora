import React from 'react';

export interface DrawerPanelProps {
  title?: string;
}

export function DrawerPanel({ title }: DrawerPanelProps) {
  return <div>{title}</div>;
}
