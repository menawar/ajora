import React from 'react';

export interface HoverCardProps {
  title?: string;
}

export function HoverCard({ title }: HoverCardProps) {
  return <div>{title}</div>;
}
