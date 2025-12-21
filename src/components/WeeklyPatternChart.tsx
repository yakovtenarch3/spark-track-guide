import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Minus, Calendar, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyGoal {
  id: string;
  title: string;
  color: string;
}

interface DailyGoalLog {
  id: string;
  goal_id: string;
  log_date: string;
  succeeded: boolean;
}

interface WeeklyPatternChartProps {
  goals: DailyGoal[];
  logs: DailyGoalLog[];
  selectedGoalId?: string;
}

const DAY_NAMES = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const DAY_NAMES_SHORT = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

export const WeeklyPatternChart = ({ goals, logs, selectedGoalId }: WeeklyPatternChartProps) => {
  const chartData = useMemo(() => {
    // Filter logs by selected goal if provided
    const filteredLogs = selectedGoalId 
      ? logs.filter(l => l.goal_id === selectedGoalId)
      : logs;

    // Calculate stats for each day of week
    const dayStats = DAY_NAMES.map((name, index) => {
      const dayLogs = filteredLogs.filter(log => {
        const date = new Date(log.log_date);
        return date.getDay() === index;
      });

      const successCount = dayLogs.filter(l => l.succeeded).length;
      const failCount = dayLogs.filter(l => !l.succeeded).length;
      const total = successCount + failCount;
      const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;

      return {
        day: DAY_NAMES_SHORT[index],
        fullName: name,
        successRate,
        successCount,
        failCount,
        total,
        isWeakDay: total >= 3 && successRate < 50,
        isStrongDay: total >= 3 && successRate >= 80,
      };
    });

    return dayStats;
  }, [logs, selectedGoalId]);

  const insights = useMemo(() => {
    const weakDays = chartData.filter(d => d.isWeakDay);
    const strongDays = chartData.filter(d => d.isStrongDay);
    
    // Calculate overall trend (comparing weekdays to weekend)
    const weekdayStats = chartData.slice(0, 5);
    const weekendStats = chartData.slice(5);
    
    const weekdayAvg = weekdayStats.reduce((sum, d) => sum + d.successRate, 0) / 5;
    const weekendAvg = weekendStats.reduce((sum, d) => sum + d.successRate, 0) / 2;

    // Find best and worst days
    const sortedByRate = [...chartData].filter(d => d.total >= 2).sort((a, b) => b.successRate - a.successRate);
    const bestDay = sortedByRate[0];
    const worstDay = sortedByRate[sortedByRate.length - 1];

    // Calculate consistency (standard deviation)
    const rates = chartData.filter(d => d.total >= 2).map(d => d.successRate);
    const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
    const variance = rates.length > 0 
      ? rates.reduce((sum, r) => sum + Math.pow(r - avgRate, 2), 0) / rates.length 
      : 0;
    const stdDev = Math.sqrt(variance);
    const isConsistent = stdDev < 15;

    return {
      weakDays,
      strongDays,
      weekdayAvg: Math.round(weekdayAvg),
      weekendAvg: Math.round(weekendAvg),
      bestDay,
      worstDay,
      isWeekendBetter: weekendAvg > weekdayAvg + 10,
      isWeekdaysBetter: weekdayAvg > weekendAvg + 10,
      isConsistent,
      avgRate: Math.round(avgRate),
    };
  }, [chartData]);

  const getBarColor = (entry: typeof chartData[0]) => {
    if (entry.total < 2) return "hsl(var(--muted))";
    if (entry.isWeakDay) return "hsl(var(--destructive))";
    if (entry.isStrongDay) return "hsl(var(--success))";
    if (entry.successRate >= 60) return "hsl(var(--primary))";
    return "hsl(var(--warning))";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    
    const data = payload[0].payload;
    return (
      <div className="bg-popover border rounded-lg p-3 shadow-lg" dir="rtl">
        <p className="font-semibold mb-2">יום {data.fullName}</p>
        <div className="space-y-1 text-sm">
          <p className="text-success">הצלחות: {data.successCount}</p>
          <p className="text-destructive">כישלונות: {data.failCount}</p>
          <p className="font-medium">אחוז הצלחה: {data.successRate}%</p>
        </div>
        {data.isWeakDay && (
          <Badge variant="outline" className="mt-2 border-destructive/50 text-destructive">
            <AlertTriangle className="w-3 h-3 ml-1" />
            יום חלש
          </Badge>
        )}
        {data.isStrongDay && (
          <Badge variant="outline" className="mt-2 border-success/50 text-success">
            <Sparkles className="w-3 h-3 ml-1" />
            יום חזק
          </Badge>
        )}
      </div>
    );
  };

  if (logs.length < 7) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            דפוסי שבוע
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>צריך לפחות שבוע של נתונים להצגת הגרף</p>
            <p className="text-sm">המשך לסמן ימים כדי לראות את הדפוסים שלך</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              דפוסי שבוע
            </CardTitle>
            <CardDescription>ניתוח הצלחות וכישלונות לפי יום בשבוע</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            {insights.isConsistent ? (
              <Badge variant="outline" className="border-success/50 text-success">
                <Minus className="w-3 h-3 ml-1" />
                עקבי
              </Badge>
            ) : insights.weekdayAvg > insights.weekendAvg ? (
              <Badge variant="outline" className="border-primary/50 text-primary">
                <TrendingUp className="w-3 h-3 ml-1" />
                חזק בימי חול
              </Badge>
            ) : (
              <Badge variant="outline" className="border-warning/50 text-warning">
                <TrendingDown className="w-3 h-3 ml-1" />
                חזק בסופ"ש
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 12 }}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={insights.avgRate} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                label={{ 
                  value: `ממוצע: ${insights.avgRate}%`, 
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))"
                }}
              />
              <Bar 
                dataKey="successRate" 
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Weak Days */}
          {insights.weakDays.length > 0 && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="font-medium text-destructive">ימים חלשים</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {insights.weakDays.map(d => d.fullName).join(", ")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                שים לב במיוחד בימים אלו
              </p>
            </div>
          )}

          {/* Strong Days */}
          {insights.strongDays.length > 0 && (
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-success" />
                <span className="font-medium text-success">ימים חזקים</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {insights.strongDays.map(d => d.fullName).join(", ")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                נצל את המומנטום בימים אלו
              </p>
            </div>
          )}

          {/* Best Day */}
          {insights.bestDay && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="font-medium text-primary">היום הכי טוב</span>
              </div>
              <p className="text-sm text-muted-foreground">
                יום {insights.bestDay.fullName} - {insights.bestDay.successRate}% הצלחה
              </p>
            </div>
          )}

          {/* Worst Day */}
          {insights.worstDay && insights.worstDay !== insights.bestDay && (
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-warning" />
                <span className="font-medium text-warning">היום הכי קשה</span>
              </div>
              <p className="text-sm text-muted-foreground">
                יום {insights.worstDay.fullName} - {insights.worstDay.successRate}% הצלחה
              </p>
            </div>
          )}
        </div>

        {/* Trend Summary */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <p className="text-sm text-muted-foreground">
            {insights.isConsistent ? (
              <>
                <span className="font-medium text-success">הביצועים שלך עקביים</span> - ממוצע של {insights.avgRate}% הצלחה לאורך כל השבוע.
              </>
            ) : insights.isWeekendBetter ? (
              <>
                <span className="font-medium text-primary">אתה חזק יותר בסופ"ש</span> ({insights.weekendAvg}%) מאשר בימי חול ({insights.weekdayAvg}%). נסה לזהות מה עובד טוב בסופ"ש ולהעביר את זה לימי החול.
              </>
            ) : insights.isWeekdaysBetter ? (
              <>
                <span className="font-medium text-primary">אתה חזק יותר בימי חול</span> ({insights.weekdayAvg}%) מאשר בסופ"ש ({insights.weekendAvg}%). שמור על השגרה גם בסופי שבוע!
              </>
            ) : (
              <>
                ממוצע כללי: <span className="font-medium">{insights.avgRate}%</span>. ימי חול: {insights.weekdayAvg}%, סופ"ש: {insights.weekendAvg}%.
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
