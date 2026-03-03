import { useNavigate } from "react-router-dom";
import { Target, Calendar, GraduationCap } from "lucide-react";
import { useState } from "react";
import MetricCard from "@/components/MetricCard";
import { metrics } from "@/data/mockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GoalLanding = () => {
  const navigate = useNavigate();
  const [timeFrame, setTimeFrame] = useState("2024-25");
  const [grade, setGrade] = useState("all");

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
              Use comparable school benchmarking to set realistic, data-driven goals for your school.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 ml-[52px]">
          Select a metric below to begin. You'll review comparable schools, analyze peer trends, and receive a recommended goal range before making your decision.
        </p>
      </div>

      {/* Filters */}
      <div className="innovare-card p-4 mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time Frame</span>
            <Select value={timeFrame} onValueChange={setTimeFrame}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2022-23">SY 2022–23</SelectItem>
                <SelectItem value="2023-24">SY 2023–24</SelectItem>
                <SelectItem value="2024-25">SY 2024–25</SelectItem>
                <SelectItem value="2025-26">SY 2025–26</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <GraduationCap size={14} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Grade</span>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="k-2">K–2</SelectItem>
                <SelectItem value="3-5">3–5</SelectItem>
                <SelectItem value="6-8">6–8</SelectItem>
                <SelectItem value="9-12">9–12</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} onSetGoal={handleSetGoal} />
        ))}
      </div>
    </div>
  );
};

export default GoalLanding;
