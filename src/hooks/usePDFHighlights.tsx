import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type PDFHighlight } from "@/components/book/PDFHighlightViewer";

export interface DBAnnotation {
  id: string;
  book_id: string;
  page_number: number;
  note_text: string;
  highlight_text: string | null;
  position_x: number | null;
  position_y: number | null;
  color: string;
  highlight_rects: any | null;
  comment: string | null;
  highlight_type: string;
  created_at: string;
  updated_at: string;
}

// Convert DB annotation to PDFHighlight format
const dbToHighlight = (ann: DBAnnotation): PDFHighlight => {
  // If we have stored rects, use them
  if (ann.highlight_rects) {
    return {
      id: ann.id,
      type: ann.highlight_type === "area" ? "area" : "text",
      content: {
        text: ann.highlight_text || undefined,
      },
      position: ann.highlight_rects,
      comment: ann.comment || ann.note_text || undefined,
      color: ann.color,
    };
  }

  // Legacy: create a simple position from page number
  return {
    id: ann.id,
    type: "text",
    content: {
      text: ann.highlight_text || undefined,
    },
    position: {
      boundingRect: {
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 20,
        width: 100,
        height: 20,
        pageNumber: ann.page_number,
      },
      rects: [],
    },
    comment: ann.comment || ann.note_text || undefined,
    color: ann.color,
  };
};

// Convert PDFHighlight to DB format
const highlightToDB = (
  bookId: string,
  highlight: PDFHighlight
): Partial<DBAnnotation> => {
  return {
    book_id: bookId,
    page_number: highlight.position.boundingRect.pageNumber,
    note_text: highlight.comment || "הדגשה",
    highlight_text: highlight.content?.text || null,
    color: highlight.color || "#FFEB3B",
    highlight_rects: highlight.position,
    comment: highlight.comment || null,
    highlight_type: highlight.type || "text",
  };
};

export const usePDFHighlights = (bookId: string | null) => {
  const queryClient = useQueryClient();

  // Fetch highlights for a book
  const { data: highlights = [], isLoading } = useQuery({
    queryKey: ["pdf-highlights", bookId],
    queryFn: async () => {
      if (!bookId) return [];
      const { data, error } = await supabase
        .from("pdf_annotations")
        .select("*")
        .eq("book_id", bookId)
        .order("page_number", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Convert DB format to PDFHighlight format
      return (data as DBAnnotation[]).map(dbToHighlight);
    },
    enabled: !!bookId,
  });

  // Add highlight
  const addHighlight = useMutation({
    mutationFn: async (highlight: PDFHighlight) => {
      if (!bookId) throw new Error("No book ID");

      const dbData = highlightToDB(bookId, highlight);

      const { error } = await supabase
        .from("pdf_annotations")
        .insert(dbData as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-highlights", bookId] });
    },
  });

  // Update highlight
  const updateHighlight = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<PDFHighlight>;
    }) => {
      const dbUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.comment !== undefined) {
        dbUpdates.comment = updates.comment;
        dbUpdates.note_text = updates.comment || "הדגשה";
      }
      if (updates.color !== undefined) {
        dbUpdates.color = updates.color;
      }
      if (updates.position !== undefined) {
        dbUpdates.highlight_rects = updates.position;
        dbUpdates.page_number = updates.position.boundingRect.pageNumber;
      }
      if (updates.content?.text !== undefined) {
        dbUpdates.highlight_text = updates.content.text;
      }

      const { error } = await supabase
        .from("pdf_annotations")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-highlights", bookId] });
    },
  });

  // Delete highlight
  const deleteHighlight = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pdf_annotations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-highlights", bookId] });
    },
  });

  return {
    highlights,
    isLoading,
    addHighlight,
    updateHighlight,
    deleteHighlight,
  };
};
