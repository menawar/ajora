import { User2 } from "lucide-react";
import Image from "next/image";

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

export function Avatar({ src, alt = "Avatar", size = "md", className = "" }: AvatarProps) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-full bg-celo-green/10 text-celo-green ${sizeClasses[size]} ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" />
      ) : (
        <User2 className="h-1/2 w-1/2" />
      )}
    </div>
  );
}
