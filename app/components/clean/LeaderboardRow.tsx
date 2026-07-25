import React from 'react';

export interface LeaderboardRowProps {
  title?: string;
}

export function LeaderboardRow({ title }: LeaderboardRowProps) {
  return <div>{title}</div>;
}
