import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, parseISO, startOfDay, addDays } from "date-fns";

interface DailyGoal {
  id: string;
  title: string;
  description: string | null;
  color: string;
  icon: string;
  is_active: boolean;
  reminder_enabled: boolean;
  reminder_time: string | null;
  target_value: string | null;
  target_unit: string | null;
  created_at: string;
}

interface DailyGoalLog {
  id: string;
  goal_id: string;
  log_date: string;
  succeeded: boolean;
  notes: string | null;
  actual_value: string | null;
  created_at: string;
}

export const useDailyGoals = () => {
  const queryClient = useQueryClient();

  // Fetch all daily goals
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ["daily-goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_goals")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as DailyGoal[];
    },
  });

  // Fetch all logs
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["daily-goal-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_goal_logs")
        .select("*")
        .order("log_date", { ascending: false });

      if (error) throw error;
      return data as DailyGoalLog[];
    },
  });

  // Create a new goal
  const createGoal = useMutation({
    mutationFn: async ({ title, description, color, icon, reminderEnabled, reminderTime, targetValue, targetUnit }: { 
      title: string; 
      description?: string; 
      color?: string;
      icon?: string;
      reminderEnabled?: boolean;
      reminderTime?: string;
      targetValue?: string;
      targetUnit?: string;
    }) => {
      const { error } = await supabase.from("daily_goals").insert({
        title,
        description: description || null,
        color: color || "#8B5CF6",
        icon: icon || "target",
        reminder_enabled: reminderEnabled || false,
        reminder_time: reminderTime || null,
        target_value: targetValue || null,
        target_unit: targetUnit || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-goals"] });
      toast.success("היעד נוצר בהצלחה!");
    },
    onError: () => {
      toast.error("שגיאה ביצירת היעד");
    },
  });

  // Update a goal
  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DailyGoal> & { id: string }) => {
      const { error } = await supabase
        .from("daily_goals")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-goals"] });
      toast.success("היעד עודכן!");
    },
  });

  // Delete a goal
  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-goals"] });
      queryClient.invalidateQueries({ queryKey: ["daily-goal-logs"] });
      toast.success("היעד נמחק!");
    },
  });

  // Toggle daily log
  const toggleDayLog = useMutation({
    mutationFn: async ({
      goalId,
      date,
      succeeded,
      notes,
      actualValue,
    }: {
      goalId: string;
      date: Date;
      succeeded: boolean;
      notes?: string;
      actualValue?: string;
    }) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const existingLog = logs.find(
        (l) => l.goal_id === goalId && l.log_date === dateStr
      );

      if (existingLog) {
        const { error } = await supabase
          .from("daily_goal_logs")
          .update({ 
            succeeded, 
            notes: notes || null,
            actual_value: actualValue || null,
          })
          .eq("id", existingLog.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("daily_goal_logs").insert({
          goal_id: goalId,
          log_date: dateStr,
          succeeded,
          notes: notes || null,
          actual_value: actualValue || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-goal-logs"] });
      toast.success("הסימון עודכן!");
    },
    onError: () => {
      toast.error("שגיאה בעדכון");
    },
  });

  // Delete a log (clear mark)
  const deleteLog = useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from("daily_goal_logs")
        .delete()
        .eq("id", logId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-goal-logs"] });
      toast.success("הסימון בוטל!");
    },
    onError: () => {
      toast.error("שגיאה בביטול הסימון");
    },
  });

  // Get log for specific date and goal
  const getLogForDate = (goalId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return logs.find((l) => l.goal_id === goalId && l.log_date === dateStr);
  };

  // Calculate streak for a goal
  const calculateStreak = (goalId: string) => {
    const goalLogs = logs.filter((l) => l.goal_id === goalId);
    if (goalLogs.length === 0) return 0;

    const sortedLogs = [...goalLogs].sort(
      (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
    );

    let streak = 0;
    const today = startOfDay(new Date());

    for (let i = 0; i < 365; i++) {
      const checkDate = format(subDays(today, i), "yyyy-MM-dd");
      const dayLog = sortedLogs.find((l) => l.log_date === checkDate);

      if (dayLog?.succeeded) {
        streak++;
        continue;
      }

      if (i === 0 && !dayLog) continue;
      break;
    }

    return streak;
  };

  // Calculate longest streak
  const calculateLongestStreak = (goalId: string) => {
    const goalLogs = logs.filter((l) => l.goal_id === goalId && l.succeeded);
    if (goalLogs.length === 0) return 0;

    const sortedDates = goalLogs.map((l) => l.log_date).sort();

    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = parseISO(sortedDates[i - 1]);
      const currDate = parseISO(sortedDates[i]);
      const diff = Math.round(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diff === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return maxStreak;
  };

  // Get monthly stats for a goal
  const getMonthlyStats = (goalId: string) => {
    const now = new Date();
    const monthStart = format(
      new Date(now.getFullYear(), now.getMonth(), 1),
      "yyyy-MM-dd"
    );
    const goalLogs = logs.filter(
      (l) => l.goal_id === goalId && l.log_date >= monthStart && l.succeeded
    );
    const daysPassed = now.getDate();

    return {
      successDays: goalLogs.length,
      totalDays: daysPassed,
      percentage:
        daysPassed > 0 ? Math.round((goalLogs.length / daysPassed) * 100) : 0,
    };
  };

  // Get falls history for a goal
  const getFallsHistory = (goalId: string) => {
    const goalLogs = logs.filter((l) => l.goal_id === goalId);
    const sortedLogs = [...goalLogs].sort(
      (a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
    );

    const falls: {
      date: string;
      streakBefore: number;
      recoveryDays: number | null;
      notes: string | null;
    }[] = [];

    sortedLogs.forEach((log) => {
      if (!log.succeeded) {
        let streakBefore = 0;
        const fallDate = parseISO(log.log_date);

        for (let i = 1; i <= 365; i++) {
          const checkDate = format(subDays(fallDate, i), "yyyy-MM-dd");
          const prevLog = sortedLogs.find((l) => l.log_date === checkDate);
          if (prevLog?.succeeded) {
            streakBefore++;
          } else {
            break;
          }
        }

        let recoveryDays: number | null = null;
        for (let i = 1; i <= 30; i++) {
          const checkDate = format(addDays(fallDate, i), "yyyy-MM-dd");
          const nextLog = sortedLogs.find((l) => l.log_date === checkDate);
          if (nextLog?.succeeded) {
            recoveryDays = i;
            break;
          }
        }

        falls.push({
          date: log.log_date,
          streakBefore,
          recoveryDays,
          notes: log.notes,
        });
      }
    });

    return falls.slice(0, 10);
  };

  return {
    goals,
    logs,
    isLoading: goalsLoading || logsLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    deleteLog,
    toggleDayLog,
    getLogForDate,
    calculateStreak,
    calculateLongestStreak,
    getMonthlyStats,
    getFallsHistory,
  };
};
