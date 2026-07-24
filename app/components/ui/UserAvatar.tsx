interface UserAvatarProps {
  title?: string;
}

export function UserAvatar({ title = "UserAvatar" }: UserAvatarProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
