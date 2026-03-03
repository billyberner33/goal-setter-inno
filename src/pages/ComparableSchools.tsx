import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Filter, ChevronDown, ChevronUp, Users } from "lucide-react";
import { useState } from "react";
import WorkflowProgress from "@/components/WorkflowProgress";
import SimilarityBadge from "@/components/SimilarityBadge";
import { metrics, comparableSchools } from "@/data/mockData";
import { cn } from "@/lib/utils";

const ComparableSchools = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const metricId = searchParams.get("metric") || "math";
  const metric = metrics.find((m) => m.id === metricId) || metrics[1];
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);

  const peerStats = {
    count: comparableSchools.length,
    median: 16.2,
    p25: 13.8,
    p75: 19.1,
    topQuartile: 20.3,
    typicalImprovement: 2.1,
  };

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
          <div className="p-4 border-b border-border">
            <h3 className="font-heading font-semibold text-sm text-card-foreground">
              Comparable Schools ({comparableSchools.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
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
                {comparableSchools.map((school) => (
                  <>
                    <tr
                      key={school.id}
                      className={cn(
                        "border-b border-border hover:bg-muted/30 cursor-pointer transition-colors",
                        expandedSchool === school.id && "bg-muted/30"
                      )}
                      onClick={() => setExpandedSchool(expandedSchool === school.id ? null : school.id)}
                    >
                      <td className="p-3 font-medium text-card-foreground">{school.name}</td>
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
                      <td className="p-3">
                        {expandedSchool === school.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                    </tr>
                    {expandedSchool === school.id && (
                      <tr key={`${school.id}-detail`}>
                        <td colSpan={7} className="p-4 bg-muted/20">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div><span className="text-muted-foreground">Enrollment:</span> <span className="font-medium">{school.enrollment} students</span></div>
                            <div><span className="text-muted-foreground">Grade Span:</span> <span className="font-medium">{school.gradeSpan}</span></div>
                            <div><span className="text-muted-foreground">Avg. Annual Growth:</span> <span className="font-medium text-innovare-green">+{((school.trend3Year[2] - school.trend3Year[0]) / 2).toFixed(1)} pts/yr</span></div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
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
            <div className="space-y-3">
              {[
                { label: "Comparable Schools", value: `${peerStats.count} schools` },
                { label: "Peer Median Performance", value: `${peerStats.median}%` },
                { label: "25th–75th Percentile Range", value: `${peerStats.p25}%–${peerStats.p75}%` },
                { label: "Top Quartile Performance", value: `${peerStats.topQuartile}%` },
                { label: "Typical Annual Improvement", value: `+${peerStats.typicalImprovement} pts/yr` },
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
