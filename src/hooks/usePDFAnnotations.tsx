import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PDFAnnotation {
  id: string;
  book_id: string;
  page_number: number;
  note_text: string;
  highlight_text: string | null;
  position_x: number | null;
  position_y: number | null;
  color: string;
  created_at: string;
  updated_at: string;
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
      return data as PDFAnnotation[];
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
      color 
    }: { 
      bookId: string; 
      pageNumber: number; 
      noteText: string; 
      highlightText?: string;
      color?: string;
    }) => {
      const { error } = await supabase
        .from('pdf_annotations')
        .insert({
          book_id: bookId,
          page_number: pageNumber,
          note_text: noteText,
          highlight_text: highlightText,
          color: color || '#FFEB3B',
        });
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

  return {
    annotations,
    isLoading,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    getPageAnnotations,
    annotationCountsByPage,
  };
};
