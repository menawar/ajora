import React from 'react';

export interface ActivityTimelineWidgetProps {
  title?: string;
  className?: string;
}

export function ActivityTimelineWidget({ title = "ActivityTimelineWidget", className = "" }: ActivityTimelineWidgetProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
