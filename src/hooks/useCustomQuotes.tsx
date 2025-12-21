import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomQuote {
  id: string;
  text: string;
  author: string;
  category: "success" | "persistence" | "growth" | "strength" | "action";
  is_active: boolean;
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CustomQuote[];
    },
  });

  const addQuote = useMutation({
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
  });

  const updateQuote = useMutation({
    mutationFn: async ({
      id,
      text,
      author,
      category,
      is_active,
    }: {
      id: string;
      text?: string;
      author?: string;
      category?: string;
      is_active?: boolean;
    }) => {
      const updates: any = {};
      if (text !== undefined) updates.text = text;
      if (author !== undefined) updates.author = author;
      if (category !== undefined) updates.category = category;
      if (is_active !== undefined) updates.is_active = is_active;

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
      toast.success("משפט המוטיבציה עודכן בהצלחה! ✨");
    },
  });

  const deleteQuote = useMutation({
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
  });

  return {
    quotes,
    isLoading,
    addQuote: addQuote.mutate,
    updateQuote: updateQuote.mutate,
    deleteQuote: deleteQuote.mutate,
  };
};
