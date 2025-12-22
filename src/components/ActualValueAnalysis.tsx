import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, TrendingDown, Minus, ArrowLeftRight, Clock } from "lucide-react";
import { format, parseISO, subDays } from "date-fns";
import { he } from "date-fns/locale";

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
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
};

export const ActualValueAnalysis = ({ goal, logs }: ActualValueAnalysisProps) => {
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
    let recentGaps: { date: string; actual: string; gap: number }[] = [];

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
            recentGaps.push({
              date: log.log_date,
              actual: log.actual_value!,
              gap,
            });
          }
        });

        if (gaps.length > 0) {
          avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

          // Calculate trend based on recent 7 vs previous 7
          if (gaps.length >= 3) {
            const half = Math.floor(gaps.length / 2);
            const firstHalf = gaps.slice(0, half);
            const secondHalf = gaps.slice(half);
            const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
            
            // For time goals (like sleep), lower is usually better
            // For other goals, depends on context
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

    // Get last 5 entries
    const recentEntries = recentGaps.slice(-5).reverse();

    return {
      totalEntries: goalLogs.length,
      avgGap,
      trend,
      isTimeFormat,
      recentEntries,
      hasTarget: !!targetValue,
      targetValue,
    };
  }, [goal, logs]);

  if (!analysis || analysis.totalEntries === 0) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">ניתוח פער מהיעד</CardTitle>
        </div>
        <CardDescription>השוואה בין היעד לביצוע בפועל</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="w-4 h-4" />
              רשומות בפועל
            </div>
            <p className="text-xl font-bold">{analysis.totalEntries}</p>
          </div>
          
          {analysis.hasTarget && (
            <div className="p-3 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                {analysis.trend === "improving" ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : analysis.trend === "declining" ? (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                ) : (
                  <Minus className="w-4 h-4" />
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
                className="text-sm"
              >
                {analysis.trend === "improving"
                  ? "משתפר"
                  : analysis.trend === "declining"
                  ? "ירידה"
                  : "יציב"}
              </Badge>
            </div>
          )}
        </div>

        {analysis.hasTarget && analysis.recentEntries.length > 0 && (
          <>
            {/* Average Gap */}
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">פער ממוצע מהיעד:</span>
                <span className={`font-bold ${Math.abs(analysis.avgGap) <= 10 ? "text-success" : Math.abs(analysis.avgGap) <= 30 ? "text-warning" : "text-destructive"}`}>
                  {analysis.avgGap >= 0 ? "+" : ""}
                  {analysis.isTimeFormat
                    ? formatMinutesToTime(analysis.avgGap)
                    : analysis.avgGap.toFixed(1)}{" "}
                  {goal.target_unit || ""}
                </span>
              </div>
            </div>

            {/* Recent Entries */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                רשומות אחרונות
              </h4>
              <div className="space-y-1">
                {analysis.recentEntries.map((entry) => (
                  <div
                    key={entry.date}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {format(parseISO(entry.date), "EEE d/M", { locale: he })}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{entry.actual}</span>
                      <Badge
                        variant={
                          Math.abs(entry.gap) <= 10
                            ? "default"
                            : Math.abs(entry.gap) <= 30
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {entry.gap >= 0 ? "+" : ""}
                        {analysis.isTimeFormat
                          ? formatMinutesToTime(entry.gap)
                          : entry.gap.toFixed(0)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!analysis.hasTarget && (
          <p className="text-sm text-muted-foreground text-center py-2">
            הגדר יעד מספרי (בעריכת היעד) כדי לראות ניתוח פער מפורט
          </p>
        )}
      </CardContent>
    </Card>
  );
};
