import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BookNote {
  id: string;
  book_id: string;
  chapter: number | null;
  tip_id: number | null;
  note_text: string;
  note_type: 'note' | 'question' | 'insight' | 'ai_analysis';
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookBookmark {
  id: string;
  book_id: string;
  tip_id: number;
  title: string | null;
  created_at: string;
}

export interface BookProgress {
  id: string;
  book_id: string;
  current_chapter: number;
  current_tip: number;
  last_read_at: string;
  created_at: string;
}

const BOOK_ID = 'procrastination-book';

export const useBookReader = () => {
  const queryClient = useQueryClient();

  // Fetch book progress
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['book-progress', BOOK_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_progress')
        .select('*')
        .eq('book_id', BOOK_ID)
        .order('last_read_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as BookProgress | null;
    },
  });

  // Fetch all notes
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['book-notes', BOOK_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_notes')
        .select('*')
        .eq('book_id', BOOK_ID)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BookNote[];
    },
  });

  // Fetch all bookmarks
  const { data: bookmarks = [], isLoading: bookmarksLoading } = useQuery({
    queryKey: ['book-bookmarks', BOOK_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_bookmarks')
        .select('*')
        .eq('book_id', BOOK_ID)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BookBookmark[];
    },
  });

  // Update progress
  const updateProgress = useMutation({
    mutationFn: async ({ tipId }: { tipId: number }) => {
      // First try to update existing
      const { data: existing } = await supabase
        .from('book_progress')
        .select('id')
        .eq('book_id', BOOK_ID)
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('book_progress')
          .update({ current_tip: tipId, last_read_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('book_progress')
          .insert({ book_id: BOOK_ID, current_tip: tipId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-progress'] });
    },
  });

  // Add note
  const addNote = useMutation({
    mutationFn: async ({ tipId, noteText, noteType }: { tipId: number; noteText: string; noteType: BookNote['note_type'] }) => {
      const { error } = await supabase
        .from('book_notes')
        .insert({
          book_id: BOOK_ID,
          tip_id: tipId,
          note_text: noteText,
          note_type: noteType,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-notes'] });
    },
  });

  // Toggle favorite
  const toggleFavorite = useMutation({
    mutationFn: async ({ noteId, isFavorite }: { noteId: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from('book_notes')
        .update({ is_favorite: isFavorite })
        .eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-notes'] });
    },
  });

  // Delete note
  const deleteNote = useMutation({
    mutationFn: async ({ noteId }: { noteId: string }) => {
      const { error } = await supabase
        .from('book_notes')
        .delete()
        .eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-notes'] });
    },
  });

  // Add bookmark
  const addBookmark = useMutation({
    mutationFn: async ({ tipId, title }: { tipId: number; title: string }) => {
      const { error } = await supabase
        .from('book_bookmarks')
        .insert({
          book_id: BOOK_ID,
          tip_id: tipId,
          title,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-bookmarks'] });
    },
  });

  // Delete bookmark
  const deleteBookmark = useMutation({
    mutationFn: async ({ bookmarkId }: { bookmarkId: string }) => {
      const { error } = await supabase
        .from('book_bookmarks')
        .delete()
        .eq('id', bookmarkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-bookmarks'] });
    },
  });

  return {
    progress,
    notes,
    bookmarks,
    isLoading: progressLoading || notesLoading || bookmarksLoading,
    updateProgress,
    addNote,
    toggleFavorite,
    deleteNote,
    addBookmark,
    deleteBookmark,
  };
};