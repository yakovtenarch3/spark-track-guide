import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, format } from "date-fns";

export interface Completion {
  id: string;
  habit_id: string;
  completed_at: string;
  notes: string | null;
}

export const useCompletions = (days: number = 30) => {
  const { data: completions = [], isLoading } = useQuery({
    queryKey: ["completions", days],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), days));
      
      const { data, error } = await supabase
        .from("habit_completions")
        .select("*")
        .gte("completed_at", startDate.toISOString())
        .order("completed_at", { ascending: false });

      if (error) throw error;
      return data as Completion[];
    },
  });

  // Get completions by date
  const getCompletionsByDate = (date: Date) => {
    const dateStr = format(startOfDay(date), "yyyy-MM-dd");
    return completions.filter((c) => {
      const completionDate = format(new Date(c.completed_at), "yyyy-MM-dd");
      return completionDate === dateStr;
    });
  };

  // Get completion count by date
  const getCompletionCount = (date: Date) => {
    return getCompletionsByDate(date).length;
  };

  return {
    completions,
    isLoading,
    getCompletionsByDate,
    getCompletionCount,
  };
};
