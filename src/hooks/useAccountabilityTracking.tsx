import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { format, subDays, eachDayOfInterval, isSameDay, startOfDay } from "date-fns";

interface DayMetric {
  date: string;
  logged_in: boolean;
  engagement_score: number;
  habits_completed: number;
  goals_logged: number;
  wake_up_logged: boolean;
}

interface EngagementAnalytics {
  totalSessions: number;
  totalMinutes: number;
  averageSessionMinutes: number;
  currentStreak: number;
  longestStreak: number;
  totalHabits: number;
  totalTasks: number;
  totalGoals: number;
  totalJournalEntries: number;
  bestDays: Array<{ day: string; score: number }>;
  worstDays: Array<{ day: string; score: number }>;
  engagementTrend: Array<{ date: string; score: number }>;
  missedDays: number;
  lowEngagementDays: number;
  recommendations: string[];
}

export const useAccountabilityTracking = () => {
  // Fetch habit completions for last 60 days
  const { data: habitCompletions = [], isLoading: habitsLoading } = useQuery({
    queryKey: ["accountability-habits"],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), 60), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("habit_completions")
        .select("*")
        .gte("completed_at", startDate);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch daily goal logs for last 60 days
  const { data: goalLogs = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["accountability-goals"],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), 60), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("daily_goal_logs")
        .select("*")
        .gte("log_date", startDate);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch wake up logs for last 60 days
  const { data: wakeUpLogs = [], isLoading: wakeUpLoading } = useQuery({
    queryKey: ["accountability-wakeup"],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), 60), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("wake_up_logs")
        .select("*")
        .gte("wake_date", startDate);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch habits count
  const { data: habits = [] } = useQuery({
    queryKey: ["accountability-habits-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("id")
        .eq("is_archived", false);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch active daily goals count
  const { data: dailyGoals = [] } = useQuery({
    queryKey: ["accountability-daily-goals-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_goals")
        .select("id")
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate metrics per day
  const metrics: DayMetric[] = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = subDays(today, 59);
    const days = eachDayOfInterval({ start: startDate, end: today });

    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");

      // Count habit completions for this day
      const dayHabitCompletions = habitCompletions.filter((hc) =>
        isSameDay(new Date(hc.completed_at), day)
      );

      // Count goal logs for this day
      const dayGoalLogs = goalLogs.filter((gl) => gl.log_date === dateStr);

      // Check wake up log for this day
      const dayWakeUp = wakeUpLogs.find((wl) => wl.wake_date === dateStr);

      // Calculate engagement score
      const hasHabits = dayHabitCompletions.length > 0;
      const hasGoals = dayGoalLogs.length > 0;
      const hasWakeUp = !!dayWakeUp;

      const activityCount = (hasHabits ? 1 : 0) + (hasGoals ? 1 : 0) + (hasWakeUp ? 1 : 0);
      const logged_in = activityCount > 0;

      // Score: 0-100 based on activities completed
      let engagement_score = 0;
      if (habits.length > 0) {
        engagement_score += (dayHabitCompletions.length / habits.length) * 40;
      }
      if (dailyGoals.length > 0) {
        engagement_score += (dayGoalLogs.length / dailyGoals.length) * 40;
      }
      if (hasWakeUp) {
        engagement_score += 20;
      }

      return {
        date: dateStr,
        logged_in,
        engagement_score: Math.min(100, Math.round(engagement_score)),
        habits_completed: dayHabitCompletions.length,
        goals_logged: dayGoalLogs.length,
        wake_up_logged: hasWakeUp,
      };
    }).reverse(); // Most recent first
  }, [habitCompletions, goalLogs, wakeUpLogs, habits, dailyGoals]);

  // Calculate streaks
  const { currentStreak, longestStreak } = useMemo(() => {
    let current = 0;
    let longest = 0;
    let tempStreak = 0;

    // Start from most recent (index 0)
    for (let i = 0; i < metrics.length; i++) {
      if (metrics[i].logged_in) {
        tempStreak++;
        if (i === 0 || (i > 0 && metrics[i - 1].logged_in)) {
          // Continue streak
        }
      } else {
        if (i === 0) {
          current = 0;
        }
        longest = Math.max(longest, tempStreak);
        tempStreak = 0;
      }

      if (i === 0 && metrics[i].logged_in) {
        current = 1;
        for (let j = 1; j < metrics.length; j++) {
          if (metrics[j].logged_in) {
            current++;
          } else {
            break;
          }
        }
      }
    }
    longest = Math.max(longest, tempStreak, current);

    return { currentStreak: current, longestStreak: longest };
  }, [metrics]);

  // Calculate analytics
  const analytics: EngagementAnalytics = useMemo(() => {
    const totalHabits = habitCompletions.length;
    const totalGoals = goalLogs.length;
    const totalWakeUps = wakeUpLogs.length;

    const missedDays = metrics.filter((m) => !m.logged_in).length;
    const lowEngagementDays = metrics.filter((m) => m.engagement_score < 30 && m.logged_in).length;

    const bestDays = metrics
      .filter((m) => m.engagement_score > 0)
      .sort((a, b) => b.engagement_score - a.engagement_score)
      .slice(0, 5)
      .map((m) => ({ day: m.date, score: m.engagement_score }));

    const worstDays = metrics
      .filter((m) => m.logged_in && m.engagement_score < 50)
      .sort((a, b) => a.engagement_score - b.engagement_score)
      .slice(0, 5)
      .map((m) => ({ day: m.date, score: m.engagement_score }));

    const engagementTrend = metrics
      .slice(0, 14)
      .reverse()
      .map((m) => ({ date: m.date, score: m.engagement_score }));

    return {
      totalSessions: metrics.filter((m) => m.logged_in).length,
      totalMinutes: 0,
      averageSessionMinutes: 0,
      currentStreak,
      longestStreak,
      totalHabits,
      totalTasks: 0,
      totalGoals,
      totalJournalEntries: 0,
      bestDays,
      worstDays,
      engagementTrend,
      missedDays,
      lowEngagementDays,
      recommendations: generateRecommendations(metrics, currentStreak),
    };
  }, [metrics, habitCompletions, goalLogs, wakeUpLogs, currentStreak, longestStreak]);

  return {
    metrics,
    sessions: [],
    analytics,
    isLoading: habitsLoading || goalsLoading || wakeUpLoading,
  };
};

// Generate smart recommendations
function generateRecommendations(metrics: DayMetric[], currentStreak: number): string[] {
  const recommendations: string[] = [];

  if (metrics.length === 0) {
    return ["התחל לעקוב אחר הפעילות שלך כדי לקבל המלצות מותאמות אישית"];
  }

  const recentMetrics = metrics.slice(0, 7);
  const avgScore = recentMetrics.reduce((sum, m) => sum + m.engagement_score, 0) / recentMetrics.length;
  const missedDays = recentMetrics.filter((m) => !m.logged_in).length;

  // Low engagement
  if (avgScore < 30) {
    recommendations.push("📉 רמת המעורבות שלך נמוכה. נסה להגדיר יעדים קטנים יותר");
  }

  // Missed days
  if (missedDays > 2) {
    recommendations.push(`⚠️ לא סימנת פעילות ב-${missedDays} ימים בשבוע האחרון. הגדר תזכורת יומית`);
  } else if (missedDays > 0) {
    recommendations.push(`💡 פספסת ${missedDays} ימים בשבוע האחרון - נסה להיות עקבי יותר`);
  }

  // Good streak
  if (currentStreak >= 7) {
    recommendations.push(`🔥 רצף מדהים של ${currentStreak} ימים! המשך כך`);
  } else if (currentStreak >= 3) {
    recommendations.push(`✨ רצף טוב של ${currentStreak} ימים - אל תפסיק עכשיו!`);
  }

  // Activity patterns
  const habitDays = recentMetrics.filter((m) => m.habits_completed > 0).length;
  if (habitDays < 3) {
    recommendations.push("🎯 נסה להשלים לפחות הרגל אחד ביום");
  }

  const goalDays = recentMetrics.filter((m) => m.goals_logged > 0).length;
  if (goalDays < 3) {
    recommendations.push("📋 נסה לסמן את היעדים היומיים שלך כל יום");
  }

  const wakeUpDays = recentMetrics.filter((m) => m.wake_up_logged).length;
  if (wakeUpDays < 3) {
    recommendations.push("⏰ עקוב אחר זמני הקימה שלך לתובנות טובות יותר");
  }

  if (recommendations.length === 0 && avgScore >= 70) {
    recommendations.push("🌟 עבודה מצוינת! אתה על המסלול הנכון");
  }

  return recommendations;
}
