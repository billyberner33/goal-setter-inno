import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Filter, ChevronDown, ChevronUp, Users, Plus, X } from "lucide-react";
import { useState, useMemo } from "react";
import WorkflowProgress from "@/components/WorkflowProgress";
import SimilarityBadge from "@/components/SimilarityBadge";
import { metrics, comparableSchools } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

const ComparableSchools = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const metricId = searchParams.get("metric") || "math";
  const metric = metrics.find((m) => m.id === metricId) || metrics[1];
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(comparableSchools.map((s) => s.id))
  );

  const toggleSchool = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size <= 1) return prev; // keep at least 1
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(comparableSchools.map((s) => s.id)));
  const deselectAll = () => {
    // Keep only the first school
    setSelectedIds(new Set([comparableSchools[0].id]));
  };

  const selectedSchools = useMemo(
    () => comparableSchools.filter((s) => selectedIds.has(s.id)),
    [selectedIds]
  );

  const peerStats = useMemo(() => {
    const perfs = selectedSchools.map((s) => s.currentPerformance).sort((a, b) => a - b);
    const count = perfs.length;
    const median = perfs[Math.floor(count / 2)];
    const p25 = perfs[Math.floor(count * 0.25)];
    const p75 = perfs[Math.floor(count * 0.75)];
    const topQuartile = perfs[perfs.length - 1];
    const avgImprovement =
      selectedSchools.reduce((sum, s) => sum + (s.trend3Year[2] - s.trend3Year[0]) / 2, 0) / count;
    return { count, median, p25, p75, topQuartile, typicalImprovement: avgImprovement };
  }, [selectedSchools]);

  const handleStepClick = (step: number) => {
    if (step === 1) navigate(`/goals`);
  };

  return (
    <div className="animate-slide-in">
      <WorkflowProgress currentStep={2} onStepClick={handleStepClick} />

      {/* Header */}
      <div className="innovare-card p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">
              Selected Metric
            </p>
            <h2 className="font-heading font-bold text-lg text-card-foreground">
              {metric.icon} {metric.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Schools matched using Opportunity Index banding and contextual similarity scoring.
            </p>
          </div>
          <button className="flex items-center gap-2 border border-border px-3 py-2 rounded-lg text-sm font-medium text-card-foreground hover:bg-muted transition-colors">
            <Filter size={14} />
            Adjust Filters
          </button>
        </div>
      </div>

      {/* Why This Metric Matters */}
      <div className="innovare-card p-5 mb-4 border-l-4 border-l-innovare-teal">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">{metric.icon}</span>
          <div>
            <h3 className="font-heading font-semibold text-sm text-card-foreground mb-1">
              Why {metric.name} Matters for Student Success
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {metric.importance}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Table */}
        <div className="xl:col-span-2 innovare-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm text-card-foreground">
              Comparable Schools ({selectedIds.size} of {comparableSchools.length} selected)
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Select All
              </button>
              <span className="text-muted-foreground text-xs">|</span>
              <button
                onClick={deselectAll}
                className="text-xs font-medium text-muted-foreground hover:text-card-foreground transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="w-10 p-3">
                    <span className="sr-only">Include</span>
                  </th>
                  <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">School</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Community</th>
                  <th className="text-center p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">OI Score</th>
                  <th className="text-center p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Match</th>
                  <th className="text-center p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Performance</th>
                  <th className="text-center p-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">3-Yr Trend</th>
                  <th className="w-8 p-3"></th>
                </tr>
              </thead>
              <tbody>
                {comparableSchools.map((school) => {
                  const isSelected = selectedIds.has(school.id);
                  return (
                    <>
                      <tr
                        key={school.id}
                        className={cn(
                          "border-b border-border transition-colors",
                          isSelected ? "hover:bg-muted/30" : "opacity-50 bg-muted/10",
                          expandedSchool === school.id && "bg-muted/30"
                        )}
                      >
                        <td className="p-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSchool(school.id)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </td>
                        <td
                          className="p-3 font-medium text-card-foreground cursor-pointer"
                          onClick={() => setExpandedSchool(expandedSchool === school.id ? null : school.id)}
                        >
                          {school.name}
                        </td>
                        <td className="p-3 text-muted-foreground">{school.communityArea}</td>
                        <td className="p-3 text-center font-medium">{school.opportunityIndex}</td>
                        <td className="p-3 text-center"><SimilarityBadge value={school.similarityMatch} /></td>
                        <td className="p-3 text-center font-semibold">{school.currentPerformance}%</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {school.trend3Year.map((v, i) => (
                              <span key={i} className={cn(
                                "text-xs",
                                i === school.trend3Year.length - 1 ? "font-semibold text-card-foreground" : "text-muted-foreground"
                              )}>
                                {v}%{i < school.trend3Year.length - 1 && " →"}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td
                          className="p-3 cursor-pointer"
                          onClick={() => setExpandedSchool(expandedSchool === school.id ? null : school.id)}
                        >
                          {expandedSchool === school.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                      </tr>
                      {expandedSchool === school.id && (
                        <tr key={`${school.id}-detail`}>
                          <td colSpan={8} className="p-4 bg-muted/20">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div><span className="text-muted-foreground">Enrollment:</span> <span className="font-medium">{school.enrollment} students</span></div>
                              <div><span className="text-muted-foreground">Grade Span:</span> <span className="font-medium">{school.gradeSpan}</span></div>
                              <div><span className="text-muted-foreground">Avg. Annual Growth:</span> <span className="font-medium text-innovare-green">+{((school.trend3Year[2] - school.trend3Year[0]) / 2).toFixed(1)} pts/yr</span></div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Peer Summary */}
        <div className="space-y-4">
          <div className="innovare-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-primary" />
              <h3 className="font-heading font-semibold text-sm text-card-foreground">Peer Context Summary</h3>
            </div>

            {/* Selected school chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedSchools.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold px-2 py-1 rounded-full"
                >
                  {s.name.split(" ")[0]}
                  <button
                    onClick={() => toggleSchool(s.id)}
                    className="hover:text-primary/70 transition-colors"
                    aria-label={`Remove ${s.name}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>

            <div className="space-y-3">
              {[
                { label: "Comparable Schools", value: `${peerStats.count} schools` },
                { label: "Peer Median Performance", value: `${peerStats.median.toFixed(1)}%` },
                { label: "25th–75th Percentile Range", value: `${peerStats.p25.toFixed(1)}%–${peerStats.p75.toFixed(1)}%` },
                { label: "Top Quartile Performance", value: `${peerStats.topQuartile.toFixed(1)}%` },
                { label: "Typical Annual Improvement", value: `+${peerStats.typicalImprovement.toFixed(1)} pts/yr` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-semibold text-card-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="innovare-card p-5 border-l-4 border-l-primary">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-card-foreground">Your school's current performance:</strong> {metric.currentValue}% — 
              positioned at the <strong className="text-card-foreground">35th percentile</strong> among comparable peers.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => navigate("/goals")}
          className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-card-foreground hover:bg-muted transition-colors"
        >
          ← Back to Metrics
        </button>
        <button
          onClick={() => navigate(`/goals/trends?metric=${metricId}`)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          View Peer Trends
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default ComparableSchools;
