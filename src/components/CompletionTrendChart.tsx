import { Card } from "@/components/ui/card";
import { useCompletions } from "@/hooks/useCompletions";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { he } from "date-fns/locale";

export const CompletionTrendChart = () => {
  const { completions } = useCompletions(14);

  // Generate data for last 14 days
  const data = Array.from({ length: 14 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 13 - i));
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

  return (
    <Card className="p-6 glass-card animate-fade-in hover:shadow-[var(--shadow-glow)] transition-[var(--transition-smooth)]">
      <h3 className="text-lg font-semibold mb-4">מגמת השלמות (14 ימים)</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
              domain={[0, maxCount + 2]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold text-card-foreground">{payload[0].payload.date}</p>
                      <p className="text-sm text-muted-foreground">
                        השלמות: {payload[0].value}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--success))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--success))", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
