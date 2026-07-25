import React from 'react';

export interface StatWidgetProps {
  title?: string;
}

export function StatWidget({ title }: StatWidgetProps) {
  return <div>{title}</div>;
}
