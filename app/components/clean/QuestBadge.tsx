import React from 'react';

export interface QuestBadgeProps {
  title?: string;
}

export function QuestBadge({ title }: QuestBadgeProps) {
  return <div>{title}</div>;
}
