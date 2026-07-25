import React from 'react';

export interface UserAvatarProps {
  title?: string;
}

export function UserAvatar({ title }: UserAvatarProps) {
  return <div>{title}</div>;
}
