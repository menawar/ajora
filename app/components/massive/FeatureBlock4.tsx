import React from 'react';

export interface FeatureBlock4Props extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function FeatureBlock4({ title = "FeatureBlock4", className = "", ...props }: FeatureBlock4Props) {
  return <div className={`p-4 m-2 flex flex-col gap-2 text-gray-900 bg-white border border-gray-200 ${className}`} {...props}>{title}</div>;
}