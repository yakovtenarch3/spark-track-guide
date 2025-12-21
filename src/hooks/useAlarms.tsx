import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Alarm {
  id: string;
  name: string;
  time: string;
  is_active: boolean;
  snooze_enabled: boolean;
  snooze_minutes: number;
  ringtone_url: string | null;
  ringtone_name: string | null;
  days_of_week: number[];
  created_at: string;
  updated_at: string;
}

export const useAlarms = () => {
  const queryClient = useQueryClient();

  const { data: alarms = [], isLoading } = useQuery({
    queryKey: ["alarms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alarms")
        .select("*")
        .order("time", { ascending: true });

      if (error) throw error;
      return data as Alarm[];
    },
  });

  const createAlarm = useMutation({
    mutationFn: async (alarm: Partial<Alarm>) => {
      const { data, error } = await supabase
        .from("alarms")
        .insert([alarm])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alarms"] });
      toast.success("השעון המעורר נוצר בהצלחה!");
    },
    onError: (error) => {
      console.error("Error creating alarm:", error);
      toast.error("שגיאה ביצירת השעון המעורר");
    },
  });

  const updateAlarm = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Alarm> & { id: string }) => {
      const { data, error } = await supabase
        .from("alarms")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alarms"] });
      toast.success("השעון המעורר עודכן!");
    },
    onError: (error) => {
      console.error("Error updating alarm:", error);
      toast.error("שגיאה בעדכון השעון המעורר");
    },
  });

  const deleteAlarm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alarms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alarms"] });
      toast.success("השעון המעורר נמחק!");
    },
    onError: (error) => {
      console.error("Error deleting alarm:", error);
      toast.error("שגיאה במחיקת השעון המעורר");
    },
  });

  const toggleAlarm = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("alarms")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["alarms"] });
      toast.success(variables.is_active ? "השעון המעורר הופעל" : "השעון המעורר כובה");
    },
    onError: (error) => {
      console.error("Error toggling alarm:", error);
      toast.error("שגיאה בשינוי מצב השעון");
    },
  });

  const uploadRingtone = async (file: File): Promise<{ url: string; name: string } | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("ringtones")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("ringtones").getPublicUrl(fileName);

      toast.success("הרינגטון הועלה בהצלחה!");
      return { url: data.publicUrl, name: file.name };
    } catch (error) {
      console.error("Error uploading ringtone:", error);
      toast.error("שגיאה בהעלאת הרינגטון");
      return null;
    }
  };

  return {
    alarms,
    isLoading,
    createAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
    uploadRingtone,
  };
};
