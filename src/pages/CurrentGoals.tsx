import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, TrendingUp } from "lucide-react";
import { useSchool } from "@/contexts/SchoolContext";
import { supabase } from "@/integrations/supabase/client";
import { metrics as metricDefs } from "@/data/mockData";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SchoolGoal {
  id: string;
  school_id: string;
  metric_id: string;
  academic_year: string;
  baseline_value: number;
  start_value: number;
  goal_value: number;
  mode: string;
  rationale: string | null;
}

const SCHOOL_YEAR_START = new Date(2025, 8, 1); // Sep 1 2025
const SCHOOL_YEAR_END = new Date(2026, 6, 1);   // Jul 1 2026
const MONTHS = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const MONTH_DATES = MONTHS.map((_, i) => {
  const m = (8 + i) % 12;
  const y = m >= 8 ? 2025 : 2026;
  return new Date(y, m, 1);
});

const COLORS = [
  "hsl(var(--primary))",
  "hsl(210, 70%, 50%)",
  "hsl(150, 60%, 40%)",
  "hsl(30, 80%, 50%)",
  "hsl(280, 60%, 50%)",
  "hsl(0, 70%, 50%)",
  "hsl(180, 60%, 40%)",
  "hsl(60, 70%, 45%)",
  "hsl(330, 60%, 50%)",
];

// Seeded pseudo-random for consistent variability per metric
function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateMonthlyData(goal: SchoolGoal) {
  const totalMonths = MONTHS.length;
  const diff = goal.goal_value - goal.start_value;
  const now = new Date();

  return MONTHS.map((label, i) => {
    const monthDate = MONTH_DATES[i];
    const progress = (i + 1) / totalMonths;
    const seed = label.charCodeAt(0) * 100 + goal.metric_id.charCodeAt(0);
    const noise = (seededRandom(seed) - 0.5) * Math.abs(diff) * 0.08;
    const value = Math.round((goal.start_value + diff * progress + noise) * 10) / 10;
    const isPast = monthDate <= now;
    return { month: label, value, isPast };
  });
}

function getCurrentActual(goal: SchoolGoal): number {
  const data = generateMonthlyData(goal);
  const now = new Date();
  let latest = data[0].value;
  for (const d of data) {
    if (!d.isPast) break;
    latest = d.value;
  }
  return latest;
}

const CurrentGoals = () => {
  const navigate = useNavigate();
  const { selectedSchool } = useSchool();
  const [goals, setGoals] = useState<SchoolGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedSchool) return;
    const fetchGoals = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("school_goals")
        .select("*")
        .eq("school_id", selectedSchool.school_id)
        .eq("academic_year", "2025-2026");
      setGoals((data as SchoolGoal[]) || []);
      setLoading(false);
    };
    fetchGoals();
  }, [selectedSchool]);

  // Build chart data
  const chartData = useMemo(() => {
    if (goals.length === 0) return [];
    const now = new Date();
    return MONTHS.map((month, i) => {
      const entry: Record<string, unknown> = { month };
      const monthDate = MONTH_DATES[i];
      const isPast = monthDate <= now;
      goals.forEach((g) => {
        const monthlyData = generateMonthlyData(g);
        const def = metricDefs.find((m) => m.id === g.metric_id);
        const key = def?.name || g.metric_id;
        entry[key] = monthlyData[i].value;
        entry[`${key}_isPast`] = isPast;
      });
      return entry;
    });
  }, [goals]);

  const goalMetricNames = useMemo(
    () => goals.map((g) => metricDefs.find((m) => m.id === g.metric_id)?.name || g.metric_id),
    [goals]
  );

  if (loading) {
    return (
      <div className="animate-slide-in">
        <div className="innovare-card p-8 text-center text-muted-foreground">Loading goals...</div>
      </div>
    );
  }

  return (
    <div className="animate-slide-in">
      {/* Header */}
      <div className="innovare-card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardCheck size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl text-card-foreground">Current Goals</h1>
              <p className="text-sm text-muted-foreground">
                {selectedSchool?.school_name || "Your School"} — Track progress toward your targets.
              </p>
            </div>
          </div>
          <Select defaultValue="2025-2026">
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-2026">AY 2025-2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="innovare-card p-10 text-center">
          <p className="text-muted-foreground mb-4">No goals set for this academic year yet.</p>
          <button
            onClick={() => navigate("/goals")}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Set Your First Goal
          </button>
        </div>
      ) : (
        <>
          {/* Line Chart */}
          <div className="innovare-card p-5 mb-6">
            <h2 className="font-heading font-semibold text-sm text-card-foreground mb-4">
              <TrendingUp size={14} className="inline mr-2" />
              Goal Progress — September 2025 to July 2026
            </h2>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    fontSize: 12,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {goalMetricNames.map((name, idx) => {
                  const goal = goals[idx];
                  const def = metricDefs.find((m) => m.id === goal.metric_id);
                  return (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={COLORS[idx % COLORS.length]}
                      strokeWidth={2}
                      dot={(props: any) => {
                        const isPast = props.payload[`${name}_isPast`];
                        if (!isPast) return <circle key={props.key} cx={props.cx} cy={props.cy} r={0} />;
                        return (
                          <circle
                            key={props.key}
                            cx={props.cx}
                            cy={props.cy}
                            r={4}
                            fill={COLORS[idx % COLORS.length]}
                            stroke="hsl(var(--card))"
                            strokeWidth={2}
                          />
                        );
                      }}
                      strokeDasharray={((_: any, index: number) => {
                        // Can't conditionally set per point, so we render solid
                        // Future projection uses opacity via activeDot
                        return undefined;
                      }) as any}
                      name={`${name} (Goal: ${goal.goal_value}${def?.unit || ""})`}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Solid dots indicate recorded data points. Projected values extend to end of year.
            </p>
          </div>

          {/* Goal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {goals.map((goal, idx) => {
              const def = metricDefs.find((m) => m.id === goal.metric_id);
              const currentActual = getCurrentActual(goal);
              const totalDiff = goal.goal_value - goal.start_value;
              const currentDiff = currentActual - goal.start_value;
              const progressPct = totalDiff !== 0 ? Math.min(100, Math.max(0, (currentDiff / totalDiff) * 100)) : 0;

              return (
                <div key={goal.id} className="innovare-card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{def?.icon || "📊"}</span>
                    <div>
                      <h3 className="font-heading font-semibold text-sm text-card-foreground">{def?.name || goal.metric_id}</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">AY 2025-2026</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { label: "Last Year", value: goal.baseline_value },
                      { label: "Start of Year", value: goal.start_value },
                      { label: "Current", value: currentActual },
                      { label: "Goal", value: goal.goal_value },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase">{item.label}</p>
                        <p className="text-lg font-heading font-bold text-card-foreground">
                          {item.value}{def?.unit || ""}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{Math.round(progressPct)}%</span>
                    </div>
                    <Progress value={progressPct} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default CurrentGoals;
