interface ConfettiOverlayProps {
  title?: string;
}

export function ConfettiOverlay({ title = "ConfettiOverlay" }: ConfettiOverlayProps) {
  return <div className="p-4 flex items-center justify-center">{title}</div>;
}
