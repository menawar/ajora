import React from 'react';

export interface SponsorPoolCardProps {
  title?: string;
}

export function SponsorPoolCard({ title }: SponsorPoolCardProps) {
  return <div>{title}</div>;
}
