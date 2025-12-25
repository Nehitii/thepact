import bondIcon from "@/assets/bond-icon.png";

interface BondIconProps {
  className?: string;
  size?: number;
}

export function BondIcon({ className = "", size = 24 }: BondIconProps) {
  return (
    <img 
      src={bondIcon} 
      alt="Bonds" 
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
