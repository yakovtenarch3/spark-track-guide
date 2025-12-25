import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface JournalEntry {
  id: string;
  user_id: string;
  title?: string;
  content: string;
  mood?: "great" | "good" | "neutral" | "bad" | "terrible";
  tags?: string[];
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
}

const JOURNAL_PASSWORD = "הצלחה";
const STORAGE_KEY = "journal_unlocked";

export const useJournal = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Check if journal is unlocked
  useEffect(() => {
    const unlocked = sessionStorage.getItem(STORAGE_KEY);
    if (unlocked === "true") {
      setIsUnlocked(true);
    }
  }, []);

  // Unlock journal with password
  const unlock = (password: string): boolean => {
    if (password === JOURNAL_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      setIsUnlocked(true);
      toast({
        title: "🔓 יומן נפתח בהצלחה",
        description: "ברוך הבא ליומן האישי שלך",
      });
      return true;
    } else {
      toast({
        title: "❌ סיסמא שגויה",
        description: "נסה שוב",
        variant: "destructive",
      });
      return false;
    }
  };

  // Lock journal
  const lock = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setIsUnlocked(false);
    toast({
      title: "🔒 היומן ננעל",
      description: "המידע שלך מאובטח",
    });
  };

  // Fetch all journal entries
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["journal-entries"],
    queryFn: async () => {
      if (!isUnlocked) return [];

      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as JournalEntry[];
    },
    enabled: isUnlocked,
  });

  // Get entries by date range
  const getEntriesByDateRange = async (startDate: string, endDate: string) => {
    if (!isUnlocked) return [];

    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as JournalEntry[];
  };

  // Add new entry
  const addEntry = useMutation({
    mutationFn: async (entry: {
      title?: string;
      content: string;
      mood?: string;
      tags?: string[];
    }) => {
      if (!isUnlocked) throw new Error("Journal is locked");

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("journal_entries")
        .insert({
          user_id: userData.user.id,
          ...entry,
        })
        .select()
        .single();

      if (error) throw error;

      // Track activity
      await supabase.from("activity_tracking").insert({
        user_id: userData.user.id,
        activity_type: "journal_entry",
        activity_category: "journal",
        activity_id: data.id,
        metadata: { mood: entry.mood, tags: entry.tags },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast({
        title: "✅ נשמר בהצלחה",
        description: "הרשומה נוספה ליומן",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ שגיאה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update entry
  const updateEntry = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<JournalEntry> & { id: string }) => {
      if (!isUnlocked) throw new Error("Journal is locked");

      const { data, error } = await supabase
        .from("journal_entries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast({
        title: "✅ עודכן בהצלחה",
        description: "הרשומה עודכנה",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ שגיאה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete entry
  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      if (!isUnlocked) throw new Error("Journal is locked");

      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      toast({
        title: "🗑️ נמחק בהצלחה",
        description: "הרשומה הוסרה מהיומן",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ שגיאה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Search entries
  const searchEntries = async (query: string) => {
    if (!isUnlocked) return [];

    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as JournalEntry[];
  };

  // Get entries by mood
  const getEntriesByMood = async (mood: string) => {
    if (!isUnlocked) return [];

    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("mood", mood)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as JournalEntry[];
  };

  // Get entries by tag
  const getEntriesByTag = async (tag: string) => {
    if (!isUnlocked) return [];

    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .contains("tags", [tag])
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as JournalEntry[];
  };

  return {
    // Auth
    isUnlocked,
    unlock,
    lock,

    // Data
    entries,
    isLoading,

    // Mutations
    addEntry,
    updateEntry,
    deleteEntry,

    // Queries
    getEntriesByDateRange,
    searchEntries,
    getEntriesByMood,
    getEntriesByTag,
  };
};
