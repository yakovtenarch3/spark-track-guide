import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, TrendingDown, Minus, ArrowLeftRight, Clock, LineChart as LineChartIcon, BarChart3, AreaChart } from "lucide-react";
import { format, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

interface DailyGoal {
  id: string;
  title: string;
  target_value: string | null;
  target_unit: string | null;
}

interface DailyGoalLog {
  id: string;
  goal_id: string;
  log_date: string;
  succeeded: boolean;
  actual_value: string | null;
}

interface ActualValueAnalysisProps {
  goal: DailyGoal;
  logs: DailyGoalLog[];
}

type ChartType = "line" | "bar" | "area";

const CHART_OPTIONS: { value: ChartType; label: string; icon: typeof LineChartIcon }[] = [
  { value: "line", label: "קו", icon: LineChartIcon },
  { value: "bar", label: "עמודות", icon: BarChart3 },
  { value: "area", label: "אזור", icon: AreaChart },
];

// Parse time string (HH:MM) to minutes
const parseTimeToMinutes = (timeStr: string): number | null => {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours * 60 + minutes;
  }
  return null;
};

// Parse numeric value
const parseNumericValue = (str: string): number | null => {
  const num = parseFloat(str.replace(/[^\d.-]/g, ""));
  return isNaN(num) ? null : num;
};

// Format minutes back to time
const formatMinutesToTime = (minutes: number): string => {
  const sign = minutes < 0 ? "-" : "";
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  return `${sign}${h}:${m.toString().padStart(2, "0")}`;
};

const CustomTooltip = ({ active, payload, label, isTimeFormat, unit }: any) => {
  if (active && payload && payload.length) {
    const gap = payload[0].value;
    return (
      <div className="bg-popover/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            בפועל: <span className="font-medium text-foreground">{payload[0].payload.actual}</span>
          </p>
          <p className="text-sm">
            פער:{" "}
            <span className={`font-bold ${gap <= 0 ? "text-success" : gap <= 30 ? "text-warning" : "text-destructive"}`}>
              {gap >= 0 ? "+" : ""}
              {isTimeFormat ? formatMinutesToTime(gap) : gap.toFixed(0)} {unit || ""}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const ActualValueAnalysis = ({ goal, logs }: ActualValueAnalysisProps) => {
  const [chartType, setChartType] = useState<ChartType>("line");

  const analysis = useMemo(() => {
    const goalLogs = logs.filter(
      (l) => l.goal_id === goal.id && l.actual_value && l.actual_value.trim() !== ""
    );

    if (goalLogs.length === 0) return null;

    // Sort by date
    const sortedLogs = [...goalLogs].sort(
      (a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime()
    );

    const targetValue = goal.target_value;
    const isTimeFormat = targetValue ? parseTimeToMinutes(targetValue) !== null : false;

    // Calculate gaps if there's a target
    let gaps: number[] = [];
    let avgGap = 0;
    let trend: "improving" | "declining" | "stable" = "stable";
    let chartData: { date: string; gap: number; actual: string; label: string }[] = [];

    if (targetValue) {
      const targetMinutes = isTimeFormat ? parseTimeToMinutes(targetValue) : parseNumericValue(targetValue);
      
      if (targetMinutes !== null) {
        sortedLogs.forEach((log) => {
          const actualMinutes = isTimeFormat
            ? parseTimeToMinutes(log.actual_value!)
            : parseNumericValue(log.actual_value!);
          
          if (actualMinutes !== null) {
            const gap = actualMinutes - targetMinutes;
            gaps.push(gap);
            chartData.push({
              date: log.log_date,
              gap,
              actual: log.actual_value!,
              label: format(parseISO(log.log_date), "d/M", { locale: he }),
            });
          }
        });

        if (gaps.length > 0) {
          avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

          // Calculate trend based on halves
          if (gaps.length >= 3) {
            const half = Math.floor(gaps.length / 2);
            const firstHalf = gaps.slice(0, half);
            const secondHalf = gaps.slice(half);
            const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
            
            const improvement = Math.abs(secondAvg) < Math.abs(firstAvg);
            const decline = Math.abs(secondAvg) > Math.abs(firstAvg);
            
            if (improvement && Math.abs(secondAvg - firstAvg) > 5) {
              trend = "improving";
            } else if (decline && Math.abs(secondAvg - firstAvg) > 5) {
              trend = "declining";
            }
          }
        }
      }
    }

    // Get last 14 entries for chart
    const recentChartData = chartData.slice(-14);

    return {
      totalEntries: goalLogs.length,
      avgGap,
      trend,
      isTimeFormat,
      chartData: recentChartData,
      hasTarget: !!targetValue,
      targetValue,
    };
  }, [goal, logs]);

  if (!analysis || analysis.totalEntries === 0) {
    return null;
  }

  const renderChart = () => {
    if (!analysis.hasTarget || analysis.chartData.length === 0) return null;

    const minGap = Math.min(...analysis.chartData.map((d) => d.gap));
    const maxGap = Math.max(...analysis.chartData.map((d) => d.gap));
    const yMin = Math.min(minGap - 10, 0);
    const yMax = Math.max(maxGap + 10, 0);

    const commonProps = {
      data: analysis.chartData,
      margin: { top: 10, right: 10, left: -20, bottom: 0 },
    };

    const getBarColor = (gap: number) => {
      if (Math.abs(gap) <= 10) return "hsl(var(--success))";
      if (Math.abs(gap) <= 30) return "hsl(var(--warning))";
      return "hsl(var(--destructive))";
    };

    switch (chartType) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[yMin, yMax]} />
            <Tooltip content={<CustomTooltip isTimeFormat={analysis.isTimeFormat} unit={goal.target_unit} />} />
            <ReferenceLine y={0} stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 5" />
            <Bar dataKey="gap" radius={[4, 4, 0, 0]}>
              {analysis.chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.gap)} />
              ))}
            </Bar>
          </BarChart>
        );
      case "area":
        return (
          <RechartsAreaChart {...commonProps}>
            <defs>
              <linearGradient id="gapGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[yMin, yMax]} />
            <Tooltip content={<CustomTooltip isTimeFormat={analysis.isTimeFormat} unit={goal.target_unit} />} />
            <ReferenceLine y={0} stroke="hsl(var(--success))" strokeWidth={2} label={{ value: "יעד", position: "right", fontSize: 10 }} />
            <Area
              type="monotone"
              dataKey="gap"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#gapGradient)"
            />
          </RechartsAreaChart>
        );
      case "line":
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[yMin, yMax]} />
            <Tooltip content={<CustomTooltip isTimeFormat={analysis.isTimeFormat} unit={goal.target_unit} />} />
            <ReferenceLine y={0} stroke="hsl(var(--success))" strokeWidth={2} strokeDasharray="5 5" label={{ value: "יעד", position: "right", fontSize: 10 }} />
            <Line
              type="monotone"
              dataKey="gap"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        );
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">ניתוח פער מהיעד</CardTitle>
          </div>
          {analysis.hasTarget && analysis.chartData.length > 0 && (
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
              {CHART_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={chartType === option.value ? "default" : "ghost"}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setChartType(option.value)}
                  title={option.label}
                >
                  <option.icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          )}
        </div>
        <CardDescription>השוואה בין היעד לביצוע בפועל</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        {analysis.hasTarget && analysis.chartData.length > 0 && (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg bg-muted/30 border text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
              <Target className="w-3 h-3" />
              רשומות
            </div>
            <p className="text-lg font-bold">{analysis.totalEntries}</p>
          </div>
          
          {analysis.hasTarget && (
            <>
              <div className="p-3 rounded-lg bg-muted/30 border text-center">
                <div className="text-xs text-muted-foreground mb-1">פער ממוצע</div>
                <p className={`text-lg font-bold ${Math.abs(analysis.avgGap) <= 10 ? "text-success" : Math.abs(analysis.avgGap) <= 30 ? "text-warning" : "text-destructive"}`}>
                  {analysis.avgGap >= 0 ? "+" : ""}
                  {analysis.isTimeFormat
                    ? formatMinutesToTime(analysis.avgGap)
                    : analysis.avgGap.toFixed(0)}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                  {analysis.trend === "improving" ? (
                    <TrendingUp className="w-3 h-3 text-success" />
                  ) : analysis.trend === "declining" ? (
                    <TrendingDown className="w-3 h-3 text-destructive" />
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                  מגמה
                </div>
                <Badge
                  variant={
                    analysis.trend === "improving"
                      ? "default"
                      : analysis.trend === "declining"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {analysis.trend === "improving"
                    ? "משתפר"
                    : analysis.trend === "declining"
                    ? "ירידה"
                    : "יציב"}
                </Badge>
              </div>
            </>
          )}
        </div>

        {!analysis.hasTarget && (
          <p className="text-sm text-muted-foreground text-center py-2">
            הגדר יעד מספרי (בעריכת היעד) כדי לראות גרף פער מפורט
          </p>
        )}
      </CardContent>
    </Card>
  );
};
