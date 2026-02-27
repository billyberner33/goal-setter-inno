import { Info } from "lucide-react";

interface ExplanationPanelProps {
  title: string;
  items: { label: string; text: string }[];
}

const ExplanationPanel = ({ title, items }: ExplanationPanelProps) => {
  return (
    <div className="innovare-card p-5 border-l-4 border-l-primary">
      <div className="flex items-center gap-2 mb-3">
        <Info size={16} className="text-primary" />
        <h4 className="font-heading font-semibold text-sm text-card-foreground">{title}</h4>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
              {item.label}
            </p>
            <p className="text-sm text-card-foreground leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExplanationPanel;
