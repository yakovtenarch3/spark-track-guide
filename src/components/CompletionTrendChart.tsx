import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useCompletions } from "@/hooks/useCompletions";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { he } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings2, TrendingUp, BarChart3, Activity } from "lucide-react";

type ChartType = "line" | "bar" | "area";
type TimeRange = 7 | 14 | 30 | 60;

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: 7, label: "שבוע אחרון" },
  { value: 14, label: "שבועיים" },
  { value: 30, label: "חודש" },
  { value: 60, label: "חודשיים" },
];

const chartTypeOptions: { value: ChartType; label: string; icon: typeof TrendingUp }[] = [
  { value: "line", label: "קו", icon: TrendingUp },
  { value: "bar", label: "עמודות", icon: BarChart3 },
  { value: "area", label: "שטח", icon: Activity },
];

export const CompletionTrendChart = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>(14);
  const [chartType, setChartType] = useState<ChartType>("line");
  
  const { completions } = useCompletions(timeRange);

  // Generate data for selected time range
  const data = Array.from({ length: timeRange }, (_, i) => {
    const date = startOfDay(subDays(new Date(), timeRange - 1 - i));
    const dateStr = format(date, "yyyy-MM-dd");
    
    const count = completions.filter((c) => {
      const completionDate = format(new Date(c.completed_at), "yyyy-MM-dd");
      return completionDate === dateStr;
    }).length;

    return {
      date: format(date, "dd/MM", { locale: he }),
      count,
    };
  });

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartColor = "hsl(var(--primary))";
  const selectedTimeLabel = timeRangeOptions.find(o => o.value === timeRange)?.label || "";

  const renderChart = () => {
    const commonProps = {
      data,
    };

    const axisProps = {
      stroke: "hsl(var(--muted-foreground))",
      tick: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
      tickLine: false,
      axisLine: false,
    };

    const tooltipContent = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
            <p className="font-semibold text-card-foreground text-sm">{payload[0].payload.date}</p>
            <p className="text-sm text-muted-foreground">
              השלמות: <span className="font-medium text-primary">{payload[0].value}</span>
            </p>
          </div>
        );
      }
      return null;
    };

    switch (chartType) {
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" {...axisProps} />
            <YAxis {...axisProps} domain={[0, maxCount + 2]} width={30} />
            <Tooltip content={tooltipContent} />
            <Bar 
              dataKey="count" 
              fill={chartColor}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" {...axisProps} />
            <YAxis {...axisProps} domain={[0, maxCount + 2]} width={30} />
            <Tooltip content={tooltipContent} />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#colorCount)"
            />
          </AreaChart>
        );
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" {...axisProps} />
            <YAxis {...axisProps} domain={[0, maxCount + 2]} width={30} />
            <Tooltip content={tooltipContent} />
            <Line
              type="monotone"
              dataKey="count"
              stroke={chartColor}
              strokeWidth={2}
              dot={{ fill: chartColor, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        );
    }
  };

  return (
    <Card className="p-6 royal-card animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          מגמת השלמות ({selectedTimeLabel})
        </h3>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-card border-border">
            <DropdownMenuLabel className="text-xs text-muted-foreground">תקופה</DropdownMenuLabel>
            {timeRangeOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={timeRange === option.value ? "bg-accent" : ""}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">סוג גרף</DropdownMenuLabel>
            {chartTypeOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setChartType(option.value)}
                  className={`gap-2 ${chartType === option.value ? "bg-accent" : ""}`}
                >
                  <IconComponent className="h-4 w-4" />
                  {option.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
