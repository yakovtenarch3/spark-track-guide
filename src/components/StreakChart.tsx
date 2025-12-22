import { Card } from "@/components/ui/card";
import { useHabits } from "@/hooks/useHabits";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export const StreakChart = () => {
  const { habits } = useHabits();

  const data = habits
    .filter((h) => h.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5)
    .map((habit) => ({
      name: habit.title.length > 15 ? habit.title.substring(0, 15) + "..." : habit.title,
      streak: habit.streak,
      fill: habit.color || "hsl(var(--primary))",
    }));

  if (data.length === 0) {
    return (
      <Card className="p-6 royal-card animate-fade-in">
        <h3 className="text-lg font-semibold mb-4 text-accent gold-underline">רצפים פעילים</h3>
        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
          התחל להשלים הרגלים כדי לראות רצפים
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 royal-card animate-fade-in">
      <h3 className="text-lg font-semibold mb-4 text-accent gold-underline">רצפים פעילים</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
            <YAxis
              dataKey="name"
              type="category"
              width={120}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-card border-2 border-accent/50 rounded-lg p-3 shadow-lg">
                      <p className="font-semibold text-card-foreground">{payload[0].payload.name}</p>
                      <p className="text-sm text-muted-foreground">
                        רצף: {payload[0].value} ימים
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="streak" radius={[0, 8, 8, 0]} fill="#2C3E50" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
