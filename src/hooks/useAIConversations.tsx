import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIConversation {
  id: string;
  title: string;
  messages: Message[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export const useAIConversations = () => {
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["ai-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_coach_conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map((conv) => ({
        ...conv,
        messages: (conv.messages as unknown as Message[]) || [],
      })) as AIConversation[];
    },
  });

  const saveConversation = useMutation({
    mutationFn: async ({ title, messages }: { title: string; messages: Message[] }) => {
      const { data, error } = await supabase
        .from("ai_coach_conversations")
        .insert({ title, messages: messages as unknown as any, is_favorite: true })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
      toast.success("השיחה נשמרה למועדפים");
    },
    onError: () => {
      toast.error("שגיאה בשמירת השיחה");
    },
  });

  const deleteConversation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ai_coach_conversations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
      toast.success("השיחה נמחקה");
    },
    onError: () => {
      toast.error("שגיאה במחיקת השיחה");
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from("ai_coach_conversations")
        .update({ is_favorite: isFavorite })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
    },
  });

  return {
    conversations,
    isLoading,
    saveConversation,
    deleteConversation,
    toggleFavorite,
  };
};
