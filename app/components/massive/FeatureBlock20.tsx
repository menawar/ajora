import React from 'react';

export interface FeatureBlock20Props extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function FeatureBlock20({ title = "FeatureBlock20", className = "", ...props }: FeatureBlock20Props) {
  return <div className={`p-4 m-2 flex flex-col gap-2 text-gray-900 bg-white border border-gray-200 ${className}`} {...props}>{title}</div>;
}