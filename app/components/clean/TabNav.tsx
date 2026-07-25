import React from 'react';

export interface TabNavProps {
  title?: string;
}

export function TabNav({ title }: TabNavProps) {
  return <div>{title}</div>;
}
