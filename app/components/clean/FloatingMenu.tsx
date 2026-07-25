import React from 'react';

export interface FloatingMenuProps {
  title?: string;
}

export function FloatingMenu({ title }: FloatingMenuProps) {
  return <div>{title}</div>;
}
