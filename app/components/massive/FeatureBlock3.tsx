import React from 'react';

export interface FeatureBlock3Props extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function FeatureBlock3({ title = "FeatureBlock3", className = "", ...props }: FeatureBlock3Props) {
  return <div className={`p-4 m-2 flex flex-col gap-2 text-gray-900 bg-white border border-gray-200 ${className}`} {...props}>{title}</div>;
}