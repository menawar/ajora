import React from 'react';

export interface GovernanceVoteCardProps {
  title?: string;
  className?: string;
}

export function GovernanceVoteCard({ title = "GovernanceVoteCard", className = "" }: GovernanceVoteCardProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
