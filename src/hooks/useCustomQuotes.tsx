import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomQuote {
  id: string;
  text: string;
  author: string;
  category: "success" | "persistence" | "growth" | "strength" | "action";
  is_active: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export const useCustomQuotes = () => {
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["customQuotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_quotes")
        .select("*")
        .order("is_favorite", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CustomQuote[];
    },
  });

  const addQuoteMutation = useMutation({
    mutationFn: async (newQuote: {
      text: string;
      author: string;
      category: string;
    }) => {
      const { data, error } = await supabase
        .from("custom_quotes")
        .insert([newQuote])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customQuotes"] });
      toast.success("משפט המוטיבציה נוסף בהצלחה! ✨");
    },
    onError: (error) => {
      console.error("Error adding quote:", error);
      toast.error("שגיאה בהוספת המשפט");
    },
  });

  const updateQuoteMutation = useMutation({
    mutationFn: async ({
      id,
      text,
      author,
      category,
      is_active,
      is_favorite,
    }: {
      id: string;
      text?: string;
      author?: string;
      category?: string;
      is_active?: boolean;
      is_favorite?: boolean;
    }) => {
      const updates: Record<string, unknown> = {};
      if (text !== undefined) updates.text = text;
      if (author !== undefined) updates.author = author;
      if (category !== undefined) updates.category = category;
      if (is_active !== undefined) updates.is_active = is_active;
      if (is_favorite !== undefined) updates.is_favorite = is_favorite;

      const { data, error } = await supabase
        .from("custom_quotes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customQuotes"] });
      toast.success("המשפט עודכן בהצלחה! ✨");
    },
    onError: (error) => {
      console.error("Error updating quote:", error);
      toast.error("שגיאה בעדכון המשפט");
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_quotes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customQuotes"] });
      toast.info("משפט המוטיבציה נמחק");
    },
    onError: (error) => {
      console.error("Error deleting quote:", error);
      toast.error("שגיאה במחיקת המשפט");
    },
  });

  const addQuote = (data: { text: string; author: string; category: string }) => {
    addQuoteMutation.mutate(data);
  };

  const updateQuote = (data: {
    id: string;
    text?: string;
    author?: string;
    category?: string;
    is_active?: boolean;
    is_favorite?: boolean;
  }) => {
    updateQuoteMutation.mutate(data);
  };

  const deleteQuote = (id: string) => {
    deleteQuoteMutation.mutate(id);
  };

  const toggleFavorite = (id: string, currentFavorite: boolean) => {
    updateQuoteMutation.mutate({ id, is_favorite: !currentFavorite });
  };

  return {
    quotes,
    isLoading,
    addQuote,
    updateQuote,
    deleteQuote,
    toggleFavorite,
    isAdding: addQuoteMutation.isPending,
    isUpdating: updateQuoteMutation.isPending,
    isDeleting: deleteQuoteMutation.isPending,
  };
};
