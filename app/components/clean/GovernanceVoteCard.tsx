import React from 'react';

export interface GovernanceVoteCardProps {
  title?: string;
}

export function GovernanceVoteCard({ title }: GovernanceVoteCardProps) {
  return <div>{title}</div>;
}
