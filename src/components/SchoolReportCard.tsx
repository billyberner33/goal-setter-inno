import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ComparableSchool } from "@/data/mockData";
import SimilarityBadge from "@/components/SimilarityBadge";
import { cn } from "@/lib/utils";
import { Users, GraduationCap, MapPin, TrendingUp } from "lucide-react";

interface SchoolReportCardProps {
  school: ComparableSchool | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SchoolReportCard = ({ school, open, onOpenChange }: SchoolReportCardProps) => {
  if (!school) return null;

  const growth = ((school.trend3Year[2] - school.trend3Year[0]) / 2).toFixed(1);

  const metrics = [
    { label: "Opportunity Index", value: school.opportunityIndex.toFixed(1), suffix: "" },
    { label: "Similarity Match", value: `${school.similarityMatch}%`, badge: true },
    { label: "Student-Teacher Ratio", value: school.studentTeacherRatio ? `1:${school.studentTeacherRatio}` : "N/A" },
    { label: "Free/Reduced Lunch", value: school.freeReducedLunch ? `${school.freeReducedLunch}%` : "N/A" },
    { label: "Chronic Absenteeism", value: school.chronicAbsenteeism ? `${school.chronicAbsenteeism}%` : "N/A", negative: true },
    { label: "Math Proficiency (IAR)", value: school.mathProficiency ? `${school.mathProficiency}%` : "N/A" },
    { label: "ELA Proficiency (IAR)", value: school.elaProficiency ? `${school.elaProficiency}%` : "N/A" },
    { label: "Suspension Rate", value: school.suspensionRate ? `${school.suspensionRate}%` : "N/A", negative: true },
    { label: "Teacher Retention", value: school.teacherRetention ? `${school.teacherRetention}%` : "N/A" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{school.name}</DialogTitle>
        </DialogHeader>

        {/* Header info */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} className="text-primary" />
            {school.communityArea}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} className="text-primary" />
            {school.enrollment} students
          </span>
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap size={14} className="text-primary" />
            {school.gradeSpan}
          </span>
          {school.principal && (
            <span className="text-muted-foreground">Principal: <span className="font-medium text-card-foreground">{school.principal}</span></span>
          )}
        </div>

        {/* Performance trend */}
        <div className="innovare-card p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-primary" />
            <h4 className="font-heading font-semibold text-sm text-card-foreground">Attendance Performance — 3-Year Trend</h4>
          </div>
          <div className="flex items-end gap-3">
            {school.trend3Year.map((val, i) => {
              const labels = ["2022-23", "2023-24", "2024-25"];
              const maxH = 80;
              const minVal = Math.min(...school.trend3Year) - 5;
              const maxVal = Math.max(...school.trend3Year) + 5;
              const height = ((val - minVal) / (maxVal - minVal)) * maxH;
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <span className={cn(
                    "text-sm font-semibold",
                    i === school.trend3Year.length - 1 ? "text-primary" : "text-muted-foreground"
                  )}>
                    {val}%
                  </span>
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all",
                      i === school.trend3Year.length - 1 ? "bg-primary" : "bg-primary/30"
                    )}
                    style={{ height: `${height}px` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{labels[i]}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Avg. annual growth: <span className="font-semibold text-innovare-green">+{growth} pts/yr</span>
          </div>
        </div>

        {/* Key metrics grid */}
        <div>
          <h4 className="font-heading font-semibold text-sm text-card-foreground mb-3">Key Metrics</h4>
          <div className="grid grid-cols-3 gap-3">
            {metrics.map((m) => (
              <div key={m.label} className="bg-muted/50 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{m.label}</p>
                {m.badge ? (
                  <SimilarityBadge value={school.similarityMatch} />
                ) : (
                  <p className={cn(
                    "text-sm font-semibold",
                    m.negative ? "text-innovare-orange" : "text-card-foreground"
                  )}>
                    {m.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SchoolReportCard;
