import { cn } from "@/lib/utils";

interface SimilarityBadgeProps {
  value: number;
  className?: string;
}

const SimilarityBadge = ({ value, className }: SimilarityBadgeProps) => {
  const getColor = () => {
    if (value >= 90) return "bg-innovare-green/15 text-innovare-green border-innovare-green/30";
    if (value >= 80) return "bg-innovare-blue/15 text-innovare-blue border-innovare-blue/30";
    if (value >= 70) return "bg-innovare-orange/15 text-innovare-orange border-innovare-orange/30";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
      getColor(),
      className
    )}>
      {value}% match
    </span>
  );
};

export default SimilarityBadge;
