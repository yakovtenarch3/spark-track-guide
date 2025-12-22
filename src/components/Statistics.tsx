import { Card } from "@/components/ui/card";
import { useHabits } from "@/hooks/useHabits";
import { useCompletions } from "@/hooks/useCompletions";
import { useProfile } from "@/hooks/useProfile";
import { Target, TrendingUp, Award } from "lucide-react";
export const Statistics = () => {
  const {
    habits
  } = useHabits();
  const {
    completions
  } = useCompletions(30);
  const {
    profile
  } = useProfile();
  const completedToday = habits.filter(h => h.completedToday).length;
  const totalHabits = habits.length;
  const completionRate = totalHabits > 0 ? Math.round(completedToday / totalHabits * 100) : 0;
  const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  const last7Days = completions.filter(c => {
    const date = new Date(c.completed_at);
    const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff < 7;
  });
  const weeklyAverage = Math.round(last7Days.length / 7);
  return;
};