import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays, parseISO, subDays, startOfDay } from "date-fns";

interface WakeUpLog {
  id: string;
  wake_date: string;
  woke_up: boolean;
  target_time: string;
  actual_time: string | null;
  notes: string | null;
  created_at: string;
}

export const useWakeUpLogs = () => {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["wake-up-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wake_up_logs")
        .select("*")
        .order("wake_date", { ascending: false });

      if (error) throw error;
      return data as WakeUpLog[];
    },
  });

  const toggleWakeUp = useMutation({
    mutationFn: async ({
      date,
      wokeUp,
      actualTime,
      notes,
    }: {
      date: Date;
      wokeUp: boolean;
      actualTime?: string;
      notes?: string;
    }) => {
      const dateStr = format(date, "yyyy-MM-dd");

      // Check if log exists for this date
      const existingLog = logs.find((log) => log.wake_date === dateStr);

      const payload = {
        wake_date: dateStr,
        woke_up: wokeUp,
        actual_time: actualTime || null,
        notes: notes || null,
      };

      if (existingLog) {
        // Keep the row even when marking "לא קמתי" so we can show it on the calendar + preserve notes
        const { error } = await supabase
          .from("wake_up_logs")
          .update({
            woke_up: payload.woke_up,
            actual_time: payload.actual_time,
            notes: payload.notes,
          })
          .eq("id", existingLog.id);
        if (error) throw error;
        return;
      }

      // Create new log for both success + failed days
      const { error } = await supabase.from("wake_up_logs").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wake-up-logs"] });
      toast.success("הקימה עודכנה בהצלחה!");
    },
    onError: (error) => {
      console.error("Error updating wake-up log:", error);
      toast.error("שגיאה בעדכון הקימה");
    },
  });

  const updateTargetTime = useMutation({
    mutationFn: async (targetTime: string) => {
      // Update all future logs' target time
      const { error } = await supabase
        .from("wake_up_logs")
        .update({ target_time: targetTime })
        .gte("wake_date", format(new Date(), "yyyy-MM-dd"));
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wake-up-logs"] });
      toast.success("שעת היעד עודכנה!");
    },
  });

  // Calculate current streak
  const calculateStreak = () => {
    if (logs.length === 0) return 0;

    const sortedLogs = [...logs].sort(
      (a, b) => new Date(b.wake_date).getTime() - new Date(a.wake_date).getTime()
    );

    let streak = 0;
    const today = startOfDay(new Date());

    for (let i = 0; i < 365; i++) {
      const checkDate = format(subDays(today, i), "yyyy-MM-dd");
      const dayLog = sortedLogs.find((l) => l.wake_date === checkDate);

      if (dayLog?.woke_up) {
        streak++;
        continue;
      }

      // Allow today to be unmarked without breaking streak,
      // but if today is explicitly marked as "לא קמתי" — streak stops.
      if (i === 0 && !dayLog) continue;

      break;
    }

    return streak;
  };

  // Calculate longest streak ever
  const calculateLongestStreak = () => {
    if (logs.length === 0) return 0;
    
    const sortedDates = logs
      .filter(l => l.woke_up)
      .map(l => l.wake_date)
      .sort();
    
    if (sortedDates.length === 0) return 0;
    
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = parseISO(sortedDates[i - 1]);
      const currDate = parseISO(sortedDates[i]);
      const diff = differenceInDays(currDate, prevDate);
      
      if (diff === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return maxStreak;
  };

  // Get log for specific date
  const getLogForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return logs.find(log => log.wake_date === dateStr);
  };

  // Stats for current month
  const getMonthlyStats = () => {
    const now = new Date();
    const monthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
    const monthLogs = logs.filter(l => l.wake_date >= monthStart && l.woke_up);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    
    return {
      successDays: monthLogs.length,
      totalDays: daysPassed,
      percentage: daysPassed > 0 ? Math.round((monthLogs.length / daysPassed) * 100) : 0,
    };
  };

  return {
    logs,
    isLoading,
    toggleWakeUp,
    updateTargetTime,
    currentStreak: calculateStreak(),
    longestStreak: calculateLongestStreak(),
    getLogForDate,
    monthlyStats: getMonthlyStats(),
  };
};
