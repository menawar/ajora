import React from 'react';

export interface UserAvatarProps {
  title?: string;
  className?: string;
}

export function UserAvatar({ title = "UserAvatar", className = "" }: UserAvatarProps) {
  return <div className={`p-4 rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>{title}</div>;
}
