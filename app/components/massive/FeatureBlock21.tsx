import React from 'react';

export interface FeatureBlock21Props extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function FeatureBlock21({ title = "FeatureBlock21", className = "", ...props }: FeatureBlock21Props) {
  return <div className={`p-4 m-2 flex flex-col gap-2 text-gray-900 bg-white border border-gray-200 ${className}`} {...props}>{title}</div>;
}