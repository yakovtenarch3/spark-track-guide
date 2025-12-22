import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserBook {
  id: string;
  title: string;
  file_url: string;
  file_name: string;
  current_page: number;
  total_pages: number | null;
  last_read_at: string;
  created_at: string;
}

export const useUserBooks = () => {
  const queryClient = useQueryClient();

  // Fetch all user books
  const { data: books = [], isLoading } = useQuery({
    queryKey: ['user-books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_books')
        .select('*')
        .order('last_read_at', { ascending: false });
      
      if (error) throw error;
      return data as UserBook[];
    },
  });

  // Add a new book
  const addBook = useMutation({
    mutationFn: async ({ title, fileUrl, fileName }: { title: string; fileUrl: string; fileName: string }) => {
      const { error } = await supabase
        .from('user_books')
        .insert({
          title,
          file_url: fileUrl,
          file_name: fileName,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-books'] });
    },
  });

  // Update current page
  const updatePage = useMutation({
    mutationFn: async ({ bookId, page }: { bookId: string; page: number }) => {
      const { error } = await supabase
        .from('user_books')
        .update({ 
          current_page: page,
          last_read_at: new Date().toISOString()
        })
        .eq('id', bookId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-books'] });
    },
  });

  // Delete a book
  const deleteBook = useMutation({
    mutationFn: async ({ bookId, filePath }: { bookId: string; filePath?: string }) => {
      // Delete from storage if path provided
      if (filePath) {
        await supabase.storage.from('books').remove([filePath]);
      }
      
      // Delete from database
      const { error } = await supabase
        .from('user_books')
        .delete()
        .eq('id', bookId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-books'] });
    },
  });

  return {
    books,
    isLoading,
    addBook,
    updatePage,
    deleteBook,
  };
};
