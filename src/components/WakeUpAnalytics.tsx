import { useMemo } from "react";
import { format, parseISO, subDays, startOfWeek, endOfWeek, eachDayOfInterval, differenceInMinutes, parse } from "date-fns";
import { he } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell } from "recharts";
import { TrendingUp, TrendingDown, Minus, Clock, Calendar, BarChart3, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface WakeUpLog {
  id: string;
  wake_date: string;
  woke_up: boolean;
  target_time: string;
  actual_time: string | null;
  notes: string | null;
  created_at: string;
}

interface WakeUpAnalyticsProps {
  logs: WakeUpLog[];
  targetTime?: string;
}

export const WakeUpAnalytics = ({ logs, targetTime = "06:00" }: WakeUpAnalyticsProps) => {
  // Get last 30 days of data
  const last30DaysData = useMemo(() => {
    const today = new Date();
    const data: { date: string; dateLabel: string; actualMinutes: number | null; targetMinutes: number; diff: number | null; woke_up: boolean }[] = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const log = logs.find(l => l.wake_date === dateStr);
      
      const targetMinutesFromMidnight = timeToMinutes(log?.target_time || targetTime);
      let actualMinutes: number | null = null;
      let diff: number | null = null;
      
      if (log?.actual_time) {
        actualMinutes = timeToMinutes(log.actual_time);
        diff = circularDiffMinutes(targetMinutesFromMidnight, actualMinutes);
      }
      
      data.push({
        date: dateStr,
        dateLabel: format(date, "d/M"),
        actualMinutes,
        targetMinutes: targetMinutesFromMidnight,
        diff,
        woke_up: log?.woke_up || false,
      });
    }
    
    return data;
  }, [logs, targetTime]);

  // Calculate day of week statistics
  const dayOfWeekStats = useMemo(() => {
    const stats: Record<number, { total: number; success: number; avgDiff: number; diffs: number[] }> = {};
    
    for (let i = 0; i < 7; i++) {
      stats[i] = { total: 0, success: 0, avgDiff: 0, diffs: [] };
    }
    
    logs.forEach(log => {
      const date = parseISO(log.wake_date);
      const dayOfWeek = date.getDay();
      
      stats[dayOfWeek].total++;
      if (log.woke_up) stats[dayOfWeek].success++;
      
      if (log.actual_time) {
        const targetMins = timeToMinutes(log.target_time || targetTime);
        const actualMins = timeToMinutes(log.actual_time);
        stats[dayOfWeek].diffs.push(circularDiffMinutes(targetMins, actualMins));
      }
    });
    
    // Calculate averages
    Object.keys(stats).forEach(key => {
      const dayNum = parseInt(key);
      if (stats[dayNum].diffs.length > 0) {
        stats[dayNum].avgDiff = Math.round(
          stats[dayNum].diffs.reduce((a, b) => a + b, 0) / stats[dayNum].diffs.length
        );
      }
    });
    
    const dayNames = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
    
    return Object.entries(stats).map(([key, value]) => ({
      day: dayNames[parseInt(key)],
      dayNum: parseInt(key),
      successRate: value.total > 0 ? Math.round((value.success / value.total) * 100) : 0,
      avgDiff: value.avgDiff,
      total: value.total,
    }));
  }, [logs, targetTime]);

  // Calculate trend (compare last 2 weeks)
  const trend = useMemo(() => {
    const today = new Date();
    const thisWeekStart = subDays(today, 6);
    const lastWeekStart = subDays(today, 13);
    const lastWeekEnd = subDays(today, 7);
    
    const thisWeekLogs = logs.filter(l => {
      const date = parseISO(l.wake_date);
      return date >= thisWeekStart && date <= today && l.actual_time;
    });
    
    const lastWeekLogs = logs.filter(l => {
      const date = parseISO(l.wake_date);
      return date >= lastWeekStart && date <= lastWeekEnd && l.actual_time;
    });
    
    if (thisWeekLogs.length === 0 || lastWeekLogs.length === 0) {
      return { type: "neutral" as const, diff: 0, message: "אין מספיק נתונים להשוואה" };
    }
    
    const thisWeekAvg = thisWeekLogs.reduce((sum, l) => sum + timeToMinutes(l.actual_time!), 0) / thisWeekLogs.length;
    const lastWeekAvg = lastWeekLogs.reduce((sum, l) => sum + timeToMinutes(l.actual_time!), 0) / lastWeekLogs.length;
    
    const diffMinutes = Math.round(thisWeekAvg - lastWeekAvg);
    
    if (diffMinutes < -5) {
      return { type: "improvement" as const, diff: Math.abs(diffMinutes), message: `שיפור! קם מוקדם יותר ב-${Math.abs(diffMinutes)} דקות` };
    } else if (diffMinutes > 5) {
      return { type: "regression" as const, diff: diffMinutes, message: `נסיגה: קם מאוחר יותר ב-${diffMinutes} דקות` };
    }
    
    return { type: "stable" as const, diff: 0, message: "יציבות בזמני הקימה" };
  }, [logs]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const logsWithTime = logs.filter(l => l.actual_time);
    if (logsWithTime.length === 0) return null;
    
    const diffs = logsWithTime.map(l => {
      const targetMins = timeToMinutes(l.target_time || targetTime);
      const actualMins = timeToMinutes(l.actual_time!);
      return circularDiffMinutes(targetMins, actualMins);
    });
    
    const avgDiff = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    const onTimeCount = diffs.filter(d => d <= 0).length;
    const onTimePercentage = Math.round((onTimeCount / diffs.length) * 100);
    
    const earliest = Math.min(...logsWithTime.map(l => timeToMinutes(l.actual_time!)));
    const latest = Math.max(...logsWithTime.map(l => timeToMinutes(l.actual_time!)));
    
    return {
      avgDiff,
      onTimePercentage,
      earliest: minutesToTime(earliest),
      latest: minutesToTime(latest),
      totalDays: logsWithTime.length,
    };
  }, [logs, targetTime]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg text-right" dir="rtl">
          <p className="font-medium">{data.dateLabel}</p>
          {data.actualMinutes !== null ? (
            <>
              <p className="text-sm text-muted-foreground">
                קמתי: {minutesToTime(data.actualMinutes)}
              </p>
              <p className="text-sm text-muted-foreground">
                יעד: {minutesToTime(data.targetMinutes)}
              </p>
              <p className={cn("text-sm font-medium", data.diff <= 0 ? "text-success" : "text-destructive")}>
                {data.diff <= 0 ? `${Math.abs(data.diff)} דקות לפני היעד` : `${data.diff} דקות אחרי היעד`}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">לא נרשם זמן</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Trend Card */}
      <Card className={cn(
        "glass-card",
        trend.type === "improvement" && "border-success/30 bg-gradient-to-l from-success/10 to-transparent",
        trend.type === "regression" && "border-destructive/30 bg-gradient-to-l from-destructive/10 to-transparent",
        trend.type === "neutral" || trend.type === "stable" && "border-muted/30"
      )}>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            {trend.type === "improvement" && <TrendingUp className="w-6 h-6 text-success" />}
            {trend.type === "regression" && <TrendingDown className="w-6 h-6 text-destructive" />}
            {(trend.type === "neutral" || trend.type === "stable") && <Minus className="w-6 h-6 text-muted-foreground" />}
            <div>
              <p className={cn(
                "font-medium",
                trend.type === "improvement" && "text-success",
                trend.type === "regression" && "text-destructive"
              )}>
                {trend.message}
              </p>
              <p className="text-sm text-muted-foreground">השוואה בין השבוע הנוכחי לשבוע שעבר</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Stats */}
      {overallStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="text-center">
                <Clock className="w-5 h-5 mx-auto text-primary mb-2" />
                <p className={cn(
                  "text-xl font-bold",
                  overallStats.avgDiff <= 0 ? "text-success" : "text-destructive"
                )}>
                  {overallStats.avgDiff <= 0 ? `-${Math.abs(overallStats.avgDiff)}` : `+${overallStats.avgDiff}`} דק'
                </p>
                <p className="text-xs text-muted-foreground">ממוצע מהיעד</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="text-center">
                <Target className="w-5 h-5 mx-auto text-success mb-2" />
                <p className="text-xl font-bold text-success">{overallStats.onTimePercentage}%</p>
                <p className="text-xs text-muted-foreground">קימות בזמן</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="text-center">
                <TrendingUp className="w-5 h-5 mx-auto text-info mb-2" />
                <p className="text-xl font-bold text-info">{overallStats.earliest}</p>
                <p className="text-xs text-muted-foreground">הכי מוקדם</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="text-center">
                <TrendingDown className="w-5 h-5 mx-auto text-warning mb-2" />
                <p className="text-xl font-bold text-warning">{overallStats.latest}</p>
                <p className="text-xs text-muted-foreground">הכי מאוחר</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Wake Time Chart */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">זמני קימה - 30 ימים אחרונים</CardTitle>
          </div>
          <CardDescription>הפרש מזמן היעד בדקות (מתחת לאפס = לפני היעד)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...last30DaysData].reverse()}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="dateLabel" 
                  tick={{ fontSize: 10 }}
                  interval={2}
                  reversed
                />
                <YAxis 
                  orientation="right"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="hsl(var(--success))" strokeDasharray="5 5" strokeWidth={2} />
                <Bar 
                  dataKey="diff" 
                  radius={[4, 4, 0, 0]}
                >
                  {[...last30DaysData].reverse().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.diff === null ? "hsl(var(--muted))" : entry.diff <= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                      opacity={entry.diff === null ? 0.3 : 0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Day of Week Analysis */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">ניתוח לפי יום בשבוע</CardTitle>
          </div>
          <CardDescription>באיזה ימים הכי קל לקום בזמן?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2" dir="rtl">
            {dayOfWeekStats.map((day) => (
              <div 
                key={day.day}
                className={cn(
                  "text-center p-3 rounded-xl border transition-all",
                  day.successRate >= 70 ? "bg-success/10 border-success/30" :
                  day.successRate >= 40 ? "bg-warning/10 border-warning/30" :
                  day.total > 0 ? "bg-destructive/10 border-destructive/30" :
                  "bg-muted/30 border-muted/50"
                )}
              >
                <p className="font-semibold text-sm">{day.day}</p>
                <p className={cn(
                  "text-lg font-bold",
                  day.successRate >= 70 ? "text-success" :
                  day.successRate >= 40 ? "text-warning" :
                  day.total > 0 ? "text-destructive" : "text-muted-foreground"
                )}>
                  {day.total > 0 ? `${day.successRate}%` : "-"}
                </p>
                {day.total > 0 && day.avgDiff !== 0 && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-[10px] mt-1",
                      day.avgDiff < 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                    )}
                  >
                    {day.avgDiff > 0 ? "+" : ""}{day.avgDiff}
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            האחוז מציין הצלחה בקימה בזמן • המספר מציין ממוצע דקות מהיעד
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper functions
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Calculates the signed difference (actual - target) while handling midnight wrap.
// Example: target 23:00, actual 01:00 => +120 (not -1320)
function circularDiffMinutes(targetMinutes: number, actualMinutes: number): number {
  let diff = actualMinutes - targetMinutes;

  // Normalize into a sensible range around the target (±12h)
  if (diff <= -720) diff += 1440;
  else if (diff > 720) diff -= 1440;

  return diff;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}
