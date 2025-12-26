import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
const LOCAL_ENTRIES_KEY = "journal_entries_local";

// Helper to get entries from localStorage
const getLocalEntries = (): JournalEntry[] => {
  try {
    const stored = localStorage.getItem(LOCAL_ENTRIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Helper to save entries to localStorage
const saveLocalEntries = (entries: JournalEntry[]) => {
  localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(entries));
};

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

  // Fetch all journal entries (from localStorage since table doesn't exist)
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["journal-entries"],
    queryFn: async (): Promise<JournalEntry[]> => {
      if (!isUnlocked) return [];
      return getLocalEntries();
    },
    enabled: isUnlocked,
  });

  // Get entries by date range
  const getEntriesByDateRange = async (startDate: string, endDate: string): Promise<JournalEntry[]> => {
    if (!isUnlocked) return [];
    
    const allEntries = getLocalEntries();
    return allEntries.filter(entry => {
      const entryDate = entry.created_at;
      return entryDate >= startDate && entryDate <= endDate;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  // Add new entry
  const addEntry = useMutation({
    mutationFn: async (entry: {
      title?: string;
      content: string;
      mood?: string;
      tags?: string[];
    }): Promise<JournalEntry> => {
      if (!isUnlocked) throw new Error("Journal is locked");

      const newEntry: JournalEntry = {
        id: crypto.randomUUID(),
        user_id: "local",
        title: entry.title,
        content: entry.content,
        mood: entry.mood as JournalEntry["mood"],
        tags: entry.tags,
        is_encrypted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const entries = getLocalEntries();
      entries.unshift(newEntry);
      saveLocalEntries(entries);

      return newEntry;
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
    }: Partial<JournalEntry> & { id: string }): Promise<JournalEntry> => {
      if (!isUnlocked) throw new Error("Journal is locked");

      const entries = getLocalEntries();
      const index = entries.findIndex(e => e.id === id);
      if (index === -1) throw new Error("Entry not found");

      entries[index] = {
        ...entries[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      saveLocalEntries(entries);

      return entries[index];
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
    mutationFn: async (id: string): Promise<void> => {
      if (!isUnlocked) throw new Error("Journal is locked");

      const entries = getLocalEntries();
      const filtered = entries.filter(e => e.id !== id);
      saveLocalEntries(filtered);
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
  const searchEntries = async (query: string): Promise<JournalEntry[]> => {
    if (!isUnlocked) return [];

    const entries = getLocalEntries();
    const lowerQuery = query.toLowerCase();
    return entries.filter(entry => 
      entry.title?.toLowerCase().includes(lowerQuery) ||
      entry.content.toLowerCase().includes(lowerQuery)
    ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  // Get entries by mood
  const getEntriesByMood = async (mood: string): Promise<JournalEntry[]> => {
    if (!isUnlocked) return [];

    const entries = getLocalEntries();
    return entries.filter(entry => entry.mood === mood)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  // Get entries by tag
  const getEntriesByTag = async (tag: string): Promise<JournalEntry[]> => {
    if (!isUnlocked) return [];

    const entries = getLocalEntries();
    return entries.filter(entry => entry.tags?.includes(tag))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
