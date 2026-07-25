import React from 'react';

export interface NftGalleryCardProps {
  title?: string;
}

export function NftGalleryCard({ title }: NftGalleryCardProps) {
  return <div>{title}</div>;
}
