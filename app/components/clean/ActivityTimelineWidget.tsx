import React from 'react';

export interface ActivityTimelineWidgetProps {
  title?: string;
}

export function ActivityTimelineWidget({ title }: ActivityTimelineWidgetProps) {
  return <div>{title}</div>;
}
