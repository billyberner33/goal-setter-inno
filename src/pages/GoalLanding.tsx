import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Target, Loader2 } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import { metrics as defaultMetrics, MetricData } from "@/data/mockData";
import { useSchool } from "@/contexts/SchoolContext";
import { useSchoolMetrics, getMetricValue } from "@/hooks/useSchoolMetrics";

const GoalLanding = () => {
  const navigate = useNavigate();
  const { selectedSchool } = useSchool();
  const schoolIds = useMemo(() => selectedSchool ? [selectedSchool.school_id] : [], [selectedSchool]);
  const { metrics: schoolMetrics, loading } = useSchoolMetrics(schoolIds);

  // Overlay real data and filter out metrics without data
  const metricsWithRealData = useMemo(() => {
    if (!selectedSchool) return defaultMetrics;
    const schoolData = schoolMetrics[selectedSchool.school_id];
    if (!schoolData) return [];

    return defaultMetrics
      .map((m) => {
        const current = getMetricValue(schoolData.y2024, m.id);
        const lastYear = getMetricValue(schoolData.y2023, m.id);
        return {
          ...m,
          currentValue: current ?? m.currentValue,
          lastYearValue: lastYear ?? m.lastYearValue,
          _hasData: current !== null,
        };
      })
      .filter((m) => m._hasData);
  }, [selectedSchool, schoolMetrics]);

  const handleSetGoal = (metricId: string) => {
    navigate(`/goals/comparable?metric=${metricId}`);
  };

  return (
    <div className="animate-slide-in">
      <div className="innovare-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl text-card-foreground">
              Set Academic Goals
            </h1>
            <p className="text-sm text-muted-foreground">
              Use comparable school benchmarking to set realistic, data-driven goals
              {selectedSchool ? ` for ${selectedSchool.school_name}` : " for your school"}.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 ml-[52px]">
          Select a metric below to begin. You'll review comparable schools, analyze peer trends, and receive a recommended goal range before making your decision.
        </p>
        {loading && (
          <div className="flex items-center gap-2 mt-3 ml-[52px] text-xs text-muted-foreground">
            <Loader2 size={12} className="animate-spin" />
            Loading performance data...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {metricsWithRealData.map((metric) => (
          <MetricCard key={metric.id} metric={metric} onSetGoal={handleSetGoal} />
        ))}
      </div>
    </div>
  );
};

export default GoalLanding;
