import React from 'react';

export interface AirDropBannerProps {
  title?: string;
  className?: string;
}

export function AirDropBanner({ title = "AirDropBanner", className = "" }: AirDropBannerProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
