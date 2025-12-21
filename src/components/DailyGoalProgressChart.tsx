import { useMemo } from "react";
import { format, subDays, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Legend, Cell, ReferenceLine } from "recharts";
import { TrendingUp } from "lucide-react";

interface DailyGoal {
  id: string;
  title: string;
  color: string;
  icon: string;
}

interface DailyGoalLog {
  goal_id: string;
  log_date: string;
  succeeded: boolean;
}

interface Props {
  goals: DailyGoal[];
  logs: DailyGoalLog[];
}

export const DailyGoalProgressChart = ({ goals, logs }: Props) => {
  const chartData = useMemo(() => {
    const today = new Date();
    const data: { date: string; label: string; [key: string]: number | string }[] = [];
    
    // Get last 14 days
    for (let i = 13; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayLabel = format(date, "d/M");
      
      const dayData: { date: string; label: string; [key: string]: number | string } = {
        date: dateStr,
        label: dayLabel,
      };
      
      // Count successes for each goal on this day
      goals.forEach((goal) => {
        const log = logs.find((l) => l.goal_id === goal.id && l.log_date === dateStr);
        dayData[goal.id] = log?.succeeded ? 1 : log?.succeeded === false ? -0.5 : 0;
      });
      
      data.push(dayData);
    }
    
    return data;
  }, [goals, logs]);

  const weeklySuccessRate = useMemo(() => {
    const today = new Date();
    const weekAgo = subDays(today, 7);
    const weekAgoStr = format(weekAgo, "yyyy-MM-dd");
    
    let totalPossible = 0;
    let totalSuccess = 0;
    
    goals.forEach((goal) => {
      const weekLogs = logs.filter(
        (l) => l.goal_id === goal.id && l.log_date >= weekAgoStr && l.succeeded
      );
      totalPossible += 7;
      totalSuccess += weekLogs.length;
    });
    
    return totalPossible > 0 ? Math.round((totalSuccess / totalPossible) * 100) : 0;
  }, [goals, logs]);

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    goals.forEach((goal) => {
      config[goal.id] = {
        label: goal.title,
        color: goal.color,
      };
    });
    return config;
  }, [goals]);

  if (goals.length === 0) return null;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">התקדמות ב-14 ימים האחרונים</CardTitle>
          </div>
          <div className="text-sm text-muted-foreground">
            הצלחה שבועית: <span className="font-bold text-primary">{weeklySuccessRate}%</span>
          </div>
        </div>
        <CardDescription>מעקב אחר הצלחות וכישלונות ביעדים היומיים</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={[-1, 1]}
                ticks={[-0.5, 0, 1]}
                tickFormatter={(value) => {
                  if (value === 1) return "✓";
                  if (value === -0.5) return "✗";
                  return "";
                }}
              />
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload) return null;
                  return (
                    <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg" dir="rtl">
                      <p className="font-medium mb-2">{label}</p>
                      {payload.map((entry: any) => {
                        const goal = goals.find((g) => g.id === entry.dataKey);
                        if (!goal) return null;
                        const value = entry.value;
                        const status = value === 1 ? "הצלחה ✓" : value === -0.5 ? "כישלון ✗" : "לא סומן";
                        return (
                          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: goal.color }}
                            />
                            <span>{goal.title}:</span>
                            <span className={value === 1 ? "text-success" : value === -0.5 ? "text-destructive" : "text-muted-foreground"}>
                              {status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              {goals.map((goal) => (
                <Bar 
                  key={goal.id} 
                  dataKey={goal.id} 
                  name={goal.title}
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => {
                    const value = entry[goal.id] as number;
                    return (
                      <Cell 
                        key={`cell-${index}`}
                        fill={value === 1 ? "hsl(var(--success))" : value === -0.5 ? "hsl(var(--destructive))" : "hsl(var(--muted))"}
                        opacity={value === 0 ? 0.3 : 1}
                      />
                    );
                  })}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t mt-4 text-sm">
          {goals.map((goal) => (
            <div key={goal.id} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: goal.color }}
              />
              <span className="text-muted-foreground">{goal.title}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
