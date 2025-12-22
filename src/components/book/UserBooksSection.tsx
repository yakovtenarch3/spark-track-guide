import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  FileText, 
  Trash2, 
  Clock,
  Plus
} from "lucide-react";
import { PDFUploader } from "./PDFUploader";
import { PDFHighlightViewer, type PDFHighlight } from "./PDFHighlightViewer";
import { useUserBooks, type UserBook } from "@/hooks/useUserBooks";
import { usePDFHighlights } from "@/hooks/usePDFHighlights";
import { toast } from "sonner";

export const UserBooksSection = () => {
  const [showUploader, setShowUploader] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ url: string; name: string } | null>(null);
  const [bookTitle, setBookTitle] = useState("");
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null);

  const { books, isLoading, addBook, updatePage, deleteBook } = useUserBooks();
  const { highlights, addHighlight, updateHighlight, deleteHighlight } = usePDFHighlights(selectedBook?.id || null);

  const handleUploadComplete = (fileUrl: string, fileName: string) => {
    setPendingFile({ url: fileUrl, name: fileName });
    setBookTitle(fileName.replace('.pdf', ''));
  };

  const handleSaveBook = () => {
    if (!pendingFile || !bookTitle.trim()) {
      toast.error("נא להזין שם לספר");
      return;
    }

    addBook.mutate(
      { title: bookTitle, fileUrl: pendingFile.url, fileName: pendingFile.name },
      {
        onSuccess: () => {
          toast.success("הספר נוסף בהצלחה!");
          setPendingFile(null);
          setBookTitle("");
          setShowUploader(false);
        },
      }
    );
  };

  const handleDeleteBook = (book: UserBook) => {
    if (confirm("האם למחוק את הספר?")) {
      const urlParts = book.file_url.split('/');
      const filePath = urlParts.slice(-2).join('/');
      
      deleteBook.mutate(
        { bookId: book.id, filePath },
        {
          onSuccess: () => {
            toast.success("הספר נמחק");
            if (selectedBook?.id === book.id) {
              setSelectedBook(null);
            }
          },
        }
      );
    }
  };

  const handlePageChange = (page: number) => {
    if (selectedBook && page > 0) {
      updatePage.mutate({ bookId: selectedBook.id, page });
      setSelectedBook(prev => prev ? { ...prev, current_page: page } : null);
    }
  };

  if (selectedBook) {
    return (
      <PDFHighlightViewer
        bookId={selectedBook.id}
        fileUrl={selectedBook.file_url}
        fileName={selectedBook.title}
        currentPage={selectedBook.current_page || 1}
        onPageChange={handlePageChange}
        onDelete={() => handleDeleteBook(selectedBook)}
        onBack={() => setSelectedBook(null)}
        highlights={highlights}
        onAddHighlight={(h) => addHighlight.mutate(h)}
        onUpdateHighlight={(id, updates) => updateHighlight.mutate({ id, updates })}
        onDeleteHighlight={(id) => deleteHighlight.mutate(id)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-medium">הספרים שלי</h3>
          <Badge variant="secondary">{books.length}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUploader(!showUploader)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          הוסף ספר
        </Button>
      </div>

      {/* Uploader */}
      {showUploader && (
        <div className="space-y-4">
          <PDFUploader onUploadComplete={handleUploadComplete} />
          
          {pendingFile && (
            <Card className="p-4 royal-card">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">הקובץ הועלה! הזן שם לספר:</p>
                <Input
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="שם הספר..."
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveBook} disabled={addBook.isPending}>
                    שמור ספר
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setPendingFile(null);
                      setBookTitle("");
                    }}
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Books List */}
      {books.length === 0 ? (
        <Card className="p-8 royal-card text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            אין ספרים עדיין. העלה את הספר הראשון שלך!
          </p>
        </Card>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {books.map((book) => (
              <Card 
                key={book.id} 
                className="p-4 royal-card hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedBook(book)}
              >
                <div className="flex items-center justify-between flex-row-reverse">
                  <div className="flex items-center gap-3 flex-row-reverse text-right">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-right">
                      <h4 className="font-medium">{book.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-row-reverse">
                        <Badge variant="outline" className="text-xs">
                          עמוד {book.current_page}
                        </Badge>
                        <span className="flex items-center gap-1 flex-row-reverse">
                          <Clock className="w-3 h-3" />
                          {new Date(book.last_read_at).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBook(book);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
