import React from 'react';

export interface GlassCardProps {
  title?: string;
}

export function GlassCard({ title }: GlassCardProps) {
  return <div>{title}</div>;
}
