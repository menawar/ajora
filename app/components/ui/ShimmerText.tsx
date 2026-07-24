interface ShimmerTextProps {
  title?: string;
}

export function ShimmerText({ title = "ShimmerText" }: ShimmerTextProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
