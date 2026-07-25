import React from 'react';

export interface NftGalleryCardProps {
  title?: string;
  className?: string;
}

export function NftGalleryCard({ title = "NftGalleryCard", className = "" }: NftGalleryCardProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
