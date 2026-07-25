import React from 'react';

export interface TooltipWrapperProps {
  title?: string;
}

export function TooltipWrapper({ title }: TooltipWrapperProps) {
  return <div>{title}</div>;
}
