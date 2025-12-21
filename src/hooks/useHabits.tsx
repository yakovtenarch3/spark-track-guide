import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startOfDay } from "date-fns";

export interface Habit {
  id: string;
  title: string;
  description: string | null;
  category: string;
  color: string;
  preferred_time: string | null;
  reminder_enabled: boolean;
  reminder_time: string | null;
  streak: number;
  is_archived: boolean;
  created_at: string;
  completedToday?: boolean;
}

export const useHabits = () => {
  const queryClient = useQueryClient();

  // Fetch all habits
  const { data: habits = [], isLoading } = useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Check if each habit is completed today
      const today = startOfDay(new Date()).toISOString();
      const habitsWithCompletion = await Promise.all(
        data.map(async (habit) => {
          const { data: completion } = await supabase
            .from("habit_completions")
            .select("id")
            .eq("habit_id", habit.id)
            .gte("completed_at", today)
            .single();

          return {
            ...habit,
            completedToday: !!completion,
          };
        })
      );

      return habitsWithCompletion as Habit[];
    },
  });

  // Add habit
  const addHabit = useMutation({
    mutationFn: async (newHabit: {
      title: string;
      description: string;
      category: string;
      color: string;
      preferred_time?: string;
    }) => {
      const { data, error } = await supabase
        .from("habits")
        .insert([newHabit])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("הרגל חדש נוסף! 🎉");
    },
  });

  // Toggle habit completion
  const toggleHabit = useMutation({
    mutationFn: async ({ habitId, isCompleted }: { habitId: string; isCompleted: boolean }) => {
      const today = startOfDay(new Date()).toISOString();

      if (isCompleted) {
        // Remove completion
        const { error } = await supabase
          .from("habit_completions")
          .delete()
          .eq("habit_id", habitId)
          .gte("completed_at", today);

        if (error) throw error;

        // Update streak
        const { data: habit } = await supabase
          .from("habits")
          .select("streak")
          .eq("id", habitId)
          .single();

        if (habit) {
          await supabase
            .from("habits")
            .update({ streak: Math.max(0, habit.streak - 1) })
            .eq("id", habitId);
        }
      } else {
        // Add completion
        const { error } = await supabase
          .from("habit_completions")
          .insert([{ habit_id: habitId, completed_at: new Date().toISOString() }]);

        if (error) throw error;

        // Update streak
        const { data: habit } = await supabase
          .from("habits")
          .select("streak")
          .eq("id", habitId)
          .single();

        if (habit) {
          await supabase
            .from("habits")
            .update({ streak: habit.streak + 1 })
            .eq("id", habitId);
        }

        toast.success("כל הכבוד! 🎉");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["completions"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  // Delete habit
  const deleteHabit = useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase.from("habits").delete().eq("id", habitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.info("ההרגל נמחק");
    },
  });

  // Archive habit
  const archiveHabit = useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from("habits")
        .update({ is_archived: true })
        .eq("id", habitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.info("ההרגל הועבר לארכיון");
    },
  });

  // Update reminder settings
  const updateReminder = useMutation({
    mutationFn: async ({
      habitId,
      reminderEnabled,
      reminderTime,
    }: {
      habitId: string;
      reminderEnabled: boolean;
      reminderTime?: string;
    }) => {
      const { error } = await supabase
        .from("habits")
        .update({
          reminder_enabled: reminderEnabled,
          reminder_time: reminderTime,
        })
        .eq("id", habitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });

  return {
    habits,
    isLoading,
    addHabit: addHabit.mutate,
    toggleHabit: toggleHabit.mutate,
    deleteHabit: deleteHabit.mutate,
    archiveHabit: archiveHabit.mutate,
    updateReminder: updateReminder.mutate,
  };
};
