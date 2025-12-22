import { Card } from "@/components/ui/card";
import { useHabits } from "@/hooks/useHabits";
import { useCompletions } from "@/hooks/useCompletions";
import { useProfile } from "@/hooks/useProfile";
import { Trophy, Target, TrendingUp, Award } from "lucide-react";

export const Statistics = () => {
  const { habits } = useHabits();
  const { completions } = useCompletions(30);
  const { profile } = useProfile();

  const completedToday = habits.filter((h) => h.completedToday).length;
  const totalHabits = habits.length;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  
  const longestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak)) : 0;
  
  const last7Days = completions.filter((c) => {
    const date = new Date(c.completed_at);
    const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff < 7;
  });
  
  const weeklyAverage = Math.round(last7Days.length / 7);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-6 royal-card bg-gradient-to-br from-primary/5 to-primary/10 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-xl shadow-lg">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold text-primary">
              {completionRate}%
            </div>
            <div className="text-sm text-muted-foreground font-medium">אחוז השלמה היום</div>
          </div>
        </div>
      </Card>

      <Card className="p-6 royal-card bg-gradient-to-br from-success/5 to-success/10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-success/20 rounded-xl shadow-lg">
            <Trophy className="w-6 h-6 text-success" />
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold text-success">
              {longestStreak}
            </div>
            <div className="text-sm text-muted-foreground font-medium">הרצף הארוך ביותר</div>
          </div>
        </div>
      </Card>

      <Card className="p-6 royal-card bg-gradient-to-br from-info/5 to-info/10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-info/20 rounded-xl shadow-lg">
            <TrendingUp className="w-6 h-6 text-info" />
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold text-info">
              {weeklyAverage}
            </div>
            <div className="text-sm text-muted-foreground font-medium">ממוצע יומי (7 ימים)</div>
          </div>
        </div>
      </Card>

      <Card className="p-6 royal-card bg-gradient-to-br from-warning/5 to-warning/10 animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-warning/20 rounded-xl shadow-lg">
            <Award className="w-6 h-6 text-warning" />
          </div>
          <div className="flex-1">
            <div className="text-3xl font-bold text-warning">
              {profile?.level || 1}
            </div>
            <div className="text-sm text-muted-foreground font-medium">רמה נוכחית</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
