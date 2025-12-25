import { Card } from "@/components/ui/card";
import { useHabits } from "@/hooks/useHabits";
import { useCompletions } from "@/hooks/useCompletions";
import { useProfile } from "@/hooks/useProfile";
import { Award, Target, TrendingUp } from "lucide-react";

function daysDiffFromNow(dateIso: string) {
  const date = new Date(dateIso);
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export const Statistics = () => {
  const { habits } = useHabits();
  const { completions } = useCompletions(30);
  const { profile } = useProfile();

  const completedToday = habits.filter((h) => h.completedToday).length;
  const totalHabits = habits.length;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  const longestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak ?? 0)) : 0;

  const last7DaysCount = completions.filter((c) => daysDiffFromNow(c.completed_at) < 7).length;
  const weeklyAverage = Math.round(last7DaysCount / 7);

  const level = profile?.level ?? 1;
  const totalPoints = profile?.total_points ?? 0;

  return (
    <section aria-label="סטטיסטיקות" className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      <Card className="p-3 sm:p-4 royal-card">
        <div className="flex flex-row-reverse items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 text-right">
            <p className="text-xs sm:text-sm text-muted-foreground">היום</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">
              {completedToday} / {totalHabits}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">אחוז השלמה: {completionRate}%</p>
          </div>
          <div className="shrink-0 rounded-lg bg-primary/10 p-1.5 sm:p-2">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
        </div>
      </Card>

      <Card className="p-3 sm:p-4 royal-card">
        <div className="flex flex-row-reverse items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 text-right">
            <p className="text-xs sm:text-sm text-muted-foreground">שבוע אחרון</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{weeklyAverage}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">ממוצע השלמות ליום</p>
          </div>
          <div className="shrink-0 rounded-lg bg-accent/10 p-1.5 sm:p-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
          </div>
        </div>
      </Card>

      <Card className="p-3 sm:p-4 royal-card sm:col-span-2 md:col-span-1">
        <div className="flex flex-row-reverse items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 text-right">
            <p className="text-xs sm:text-sm text-muted-foreground">התקדמות</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground">רמה {level}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {totalPoints.toLocaleString("he-IL")} נקודות • רצף שיא: {longestStreak}
            </p>
          </div>
          <div className="shrink-0 rounded-lg bg-warning/10 p-1.5 sm:p-2">
            <Award className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
          </div>
        </div>
      </Card>
    </section>
  );
};
