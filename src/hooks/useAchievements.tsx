import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  points: number;
  unlocked?: boolean;
  unlocked_at?: string;
}

export const useAchievements = () => {
  const queryClient = useQueryClient();

  // Fetch all achievements with unlock status
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data: allAchievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("*")
        .order("points", { ascending: true });

      if (achievementsError) throw achievementsError;

      const { data: unlockedAchievements, error: unlockedError } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at");

      if (unlockedError) throw unlockedError;

      const unlockedIds = new Set(unlockedAchievements?.map((ua) => ua.achievement_id) || []);
      const unlockedMap = new Map(
        unlockedAchievements?.map((ua) => [ua.achievement_id, ua.unlocked_at]) || []
      );

      return allAchievements.map((achievement) => ({
        ...achievement,
        unlocked: unlockedIds.has(achievement.id),
        unlocked_at: unlockedMap.get(achievement.id),
      })) as Achievement[];
    },
  });

  // Unlock achievement
  const unlockAchievement = useMutation({
    mutationFn: async (achievementId: string) => {
      const { error } = await supabase
        .from("user_achievements")
        .insert([{ achievement_id: achievementId }]);

      if (error && !error.message.includes("duplicate")) {
        throw error;
      }

      // Get achievement details for toast
      const achievement = achievements.find((a) => a.id === achievementId);
      if (achievement) {
        toast.success(`הישג חדש! ${achievement.icon}`, {
          description: `${achievement.name} - +${achievement.points} נקודות`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
  });

  return {
    achievements,
    isLoading,
    unlockAchievement: unlockAchievement.mutate,
  };
};
