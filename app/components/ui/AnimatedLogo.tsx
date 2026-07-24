interface AnimatedLogoProps {
  title?: string;
}

export function AnimatedLogo({ title = "AnimatedLogo" }: AnimatedLogoProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
