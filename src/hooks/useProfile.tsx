import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  display_name: string;
  total_points: number;
  level: number;
}

export const useProfile = () => {
  const queryClient = useQueryClient();

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profile")
        .select("*")
        .single();

      if (error) throw error;
      return data as Profile;
    },
  });

  // Update profile
  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!profile) return;
      
      const { error } = await supabase
        .from("user_profile")
        .update(updates)
        .eq("id", profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  // Add points
  const addPoints = async (points: number) => {
    if (!profile) return;

    const newPoints = profile.total_points + points;
    const pointsPerLevel = 1000;
    const newLevel = Math.floor(newPoints / pointsPerLevel) + 1;

    await updateProfile.mutateAsync({
      total_points: newPoints,
      level: newLevel,
    });

    if (newLevel > profile.level) {
      return { leveledUp: true, newLevel };
    }
    return { leveledUp: false };
  };

  return {
    profile,
    isLoading,
    updateProfile: updateProfile.mutate,
    addPoints,
  };
};
