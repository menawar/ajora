interface GradientButtonProps {
  title?: string;
}

export function GradientButton({ title = "GradientButton" }: GradientButtonProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
