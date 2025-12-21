import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "./useProfile";

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  goal_type: "weekly" | "monthly";
  target_count: number;
  current_count: number;
  start_date: string;
  end_date: string;
  is_completed: boolean;
  completed_at: string | null;
  reward_points: number;
  category: string | null;
  created_at: string;
}

export const useGoals = () => {
  const queryClient = useQueryClient();
  const { profile } = useProfile();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("end_date", { ascending: true });

      if (error) throw error;
      return data as Goal[];
    },
  });

  const addGoal = useMutation({
    mutationFn: async (newGoal: Omit<Goal, "id" | "created_at" | "current_count" | "is_completed" | "completed_at">) => {
      const { data, error } = await supabase
        .from("goals")
        .insert([newGoal])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("יעד חדש נוסף בהצלחה!");
    },
  });

  const checkAndUpdateGoals = useMutation({
    mutationFn: async () => {
      // This will be called automatically when habits are completed
      // to update goal progress
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const updateGoalProgress = useMutation({
    mutationFn: async ({ goalId, increment }: { goalId: string; increment: number }) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) throw new Error("Goal not found");

      const newCount = goal.current_count + increment;
      const isCompleted = newCount >= goal.target_count;

      const updates: any = {
        current_count: newCount,
        is_completed: isCompleted,
      };

      if (isCompleted && !goal.is_completed) {
        updates.completed_at = new Date().toISOString();
        
        // Add reward points to user profile
        if (profile) {
          await supabase
            .from("user_profile")
            .update({ total_points: profile.total_points + goal.reward_points })
            .eq("id", profile.id);
        }
      }

      const { data, error } = await supabase
        .from("goals")
        .update(updates)
        .eq("id", goalId)
        .select()
        .single();

      if (error) throw error;
      return { data, isCompleted, wasCompleted: goal.is_completed };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      
      if (result.isCompleted && !result.wasCompleted) {
        const goal = goals.find((g) => g.id === result.data.id);
        toast.success(`🎉 כל הכבוד! השגת את היעד "${goal?.title}"! קיבלת ${goal?.reward_points} נקודות!`);
      }
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", goalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.info("היעד נמחק");
    },
  });

  const activeGoals = goals.filter((g) => !g.is_completed && new Date(g.end_date) > new Date());
  const completedGoals = goals.filter((g) => g.is_completed);
  const expiredGoals = goals.filter((g) => !g.is_completed && new Date(g.end_date) <= new Date());

  return {
    goals,
    activeGoals,
    completedGoals,
    expiredGoals,
    isLoading,
    addGoal,
    updateGoalProgress,
    deleteGoal,
    checkAndUpdateGoals,
  };
};
