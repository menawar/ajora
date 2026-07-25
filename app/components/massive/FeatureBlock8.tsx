import React from 'react';

export interface FeatureBlock8Props extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function FeatureBlock8({ title = "FeatureBlock8", className = "", ...props }: FeatureBlock8Props) {
  return <div className={`p-4 m-2 flex flex-col gap-2 text-gray-900 bg-white border border-gray-200 ${className}`} {...props}>{title}</div>;
}