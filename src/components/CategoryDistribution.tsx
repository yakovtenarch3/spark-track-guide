import { Card } from "@/components/ui/card";
import { useHabits } from "@/hooks/useHabits";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  health: "hsl(145 55% 45%)",
  productivity: "hsl(210 100% 60%)",
  learning: "hsl(270 60% 60%)",
  fitness: "hsl(0 70% 60%)",
  mindfulness: "hsl(38 92% 50%)",
  social: "hsl(190 80% 50%)",
  other: "hsl(210 30% 15%)",
};

const CATEGORY_NAMES: Record<string, string> = {
  health: "בריאות",
  productivity: "פרודוקטיביות",
  learning: "למידה",
  fitness: "כושר",
  mindfulness: "מיינדפולנס",
  social: "חברתי",
  other: "אחר",
};

export const CategoryDistribution = () => {
  const { habits } = useHabits();

  const categoryCount = habits.reduce((acc, habit) => {
    const category = habit.category || "other";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(categoryCount).map(([category, count]) => ({
    name: CATEGORY_NAMES[category] || category,
    value: count,
    color: CATEGORY_COLORS[category] || CATEGORY_COLORS.other,
  }));

  if (data.length === 0) {
    return (
      <Card className="p-6 glass-card animate-fade-in">
        <h3 className="text-lg font-semibold mb-4">התפלגות קטגוריות</h3>
        <div className="flex items-center justify-center h-[250px] text-muted-foreground">
          הוסף הרגלים כדי לראות התפלגות
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 glass-card animate-fade-in hover:shadow-[var(--shadow-glow)] transition-[var(--transition-smooth)]">
      <h3 className="text-lg font-semibold mb-4">התפלגות קטגוריות</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold text-card-foreground">
                        {payload[0].payload.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payload[0].value} הרגלים
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
