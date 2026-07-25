import React from 'react';

export interface AirDropBannerProps {
  title?: string;
}

export function AirDropBanner({ title }: AirDropBannerProps) {
  return <div>{title}</div>;
}
