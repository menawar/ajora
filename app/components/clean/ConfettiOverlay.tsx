import React from 'react';

export interface ConfettiOverlayProps {
  title?: string;
}

export function ConfettiOverlay({ title }: ConfettiOverlayProps) {
  return <div>{title}</div>;
}
