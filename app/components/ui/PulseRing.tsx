interface PulseRingProps {
  title?: string;
}

export function PulseRing({ title = "PulseRing" }: PulseRingProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
