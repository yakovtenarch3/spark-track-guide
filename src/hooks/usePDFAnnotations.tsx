import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PDFAnnotation {
  id: string;
  book_id: string;
  page_number: number;
  note_text: string;
  highlight_text: string | null;
  highlight_rects: HighlightRect[] | null;
  position_x: number | null;
  position_y: number | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface PDFBookmark {
  id: string;
  book_id: string;
  page_number: number;
  title: string;
  created_at: string;
}

export interface ReadingProgress {
  book_id: string;
  current_page: number;
  total_pages: number;
  last_read_at: string;
  highlights_count: number;
  notes_count: number;
}

export const usePDFAnnotations = (bookId: string | null) => {
  const queryClient = useQueryClient();

  // Fetch annotations for a book
  const { data: annotations = [], isLoading } = useQuery({
    queryKey: ['pdf-annotations', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      const { data, error } = await supabase
        .from('pdf_annotations')
        .select('*')
        .eq('book_id', bookId)
        .order('page_number', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map the data to our interface
      return (data || []).map(item => ({
        id: item.id,
        book_id: item.book_id,
        page_number: item.page_number,
        note_text: item.note_text,
        highlight_text: item.highlight_text,
        highlight_rects: item.highlight_rects as unknown as HighlightRect[] | null,
        position_x: item.position_x,
        position_y: item.position_y,
        color: item.color || '#FFEB3B',
        created_at: item.created_at,
        updated_at: item.updated_at,
      })) as PDFAnnotation[];
    },
    enabled: !!bookId,
  });

  // Add annotation
  const addAnnotation = useMutation({
    mutationFn: async ({ 
      bookId, 
      pageNumber, 
      noteText, 
      highlightText,
      color,
      highlightRects
    }: { 
      bookId: string; 
      pageNumber: number; 
      noteText: string; 
      highlightText?: string;
      color?: string;
      highlightRects?: HighlightRect[];
    }) => {
      const { error } = await supabase
        .from('pdf_annotations')
        .insert([{
          book_id: bookId,
          page_number: pageNumber,
          note_text: noteText,
          highlight_text: highlightText,
          color: color || '#FFEB3B',
          highlight_rects: highlightRects ? JSON.parse(JSON.stringify(highlightRects)) : null,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-annotations', bookId] });
    },
  });

  // Update annotation
  const updateAnnotation = useMutation({
    mutationFn: async ({ 
      annotationId, 
      noteText,
      color 
    }: { 
      annotationId: string; 
      noteText?: string;
      color?: string;
    }) => {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (noteText !== undefined) updates.note_text = noteText;
      if (color !== undefined) updates.color = color;

      const { error } = await supabase
        .from('pdf_annotations')
        .update(updates)
        .eq('id', annotationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-annotations', bookId] });
    },
  });

  // Delete annotation
  const deleteAnnotation = useMutation({
    mutationFn: async ({ annotationId }: { annotationId: string }) => {
      const { error } = await supabase
        .from('pdf_annotations')
        .delete()
        .eq('id', annotationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-annotations', bookId] });
    },
  });

  // Get annotations for a specific page
  const getPageAnnotations = (pageNumber: number) => {
    return annotations.filter(a => a.page_number === pageNumber);
  };

  // Get annotation counts by page
  const annotationCountsByPage = annotations.reduce((acc, annotation) => {
    acc[annotation.page_number] = (acc[annotation.page_number] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // ========== BOOKMARKS ==========

  // Fetch bookmarks
  const { data: bookmarks = [] } = useQuery({
    queryKey: ['pdf-bookmarks', bookId],
    queryFn: async () => {
      if (!bookId) return [];
      
      // First, try to get from pdf_annotations with is_bookmark flag
      const { data, error } = await supabase
        .from('pdf_annotations')
        .select('*')
        .eq('book_id', bookId)
        .eq('note_text', 'BOOKMARK') // Using note_text as bookmark marker
        .order('page_number', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        book_id: item.book_id,
        page_number: item.page_number,
        title: item.highlight_text || `עמוד ${item.page_number}`,
        created_at: item.created_at,
      })) as PDFBookmark[];
    },
    enabled: !!bookId,
  });

  // Add bookmark
  const addBookmark = useMutation({
    mutationFn: async ({ 
      bookId, 
      pageNumber, 
      title 
    }: { 
      bookId: string; 
      pageNumber: number; 
      title: string;
    }) => {
      const { error } = await supabase
        .from('pdf_annotations')
        .insert([{
          book_id: bookId,
          page_number: pageNumber,
          note_text: 'BOOKMARK', // Marker for bookmark
          highlight_text: title,
          color: '#4CAF50', // Green color for bookmarks
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-bookmarks', bookId] });
    },
  });

  // Delete bookmark
  const deleteBookmark = useMutation({
    mutationFn: async ({ bookmarkId }: { bookmarkId: string }) => {
      const { error } = await supabase
        .from('pdf_annotations')
        .delete()
        .eq('id', bookmarkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-bookmarks', bookId] });
    },
  });

  // ========== READING PROGRESS ==========

  // Update reading progress
  const updateProgress = useMutation({
    mutationFn: async ({ 
      bookId, 
      currentPage, 
      totalPages 
    }: { 
      bookId: string; 
      currentPage: number; 
      totalPages: number;
    }) => {
      // Count highlights and notes
      const highlightsCount = annotations.filter(a => a.highlight_text).length;
      const notesCount = annotations.filter(a => a.note_text && a.note_text !== 'BOOKMARK').length;

      // Update user_books table
      const { error } = await supabase
        .from('user_books')
        .update({
          current_page: currentPage,
          total_pages: totalPages,
          last_read_at: new Date().toISOString(),
        })
        .eq('id', bookId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-books'] });
    },
  });

  return {
    // Annotations
    annotations,
    isLoading,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    getPageAnnotations,
    annotationCountsByPage,
    
    // Bookmarks
    bookmarks,
    addBookmark,
    deleteBookmark,
    
    // Progress
    updateProgress,
  };
};
