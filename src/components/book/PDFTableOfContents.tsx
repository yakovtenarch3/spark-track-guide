import { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, BookOpen, ChevronDown, ChevronLeft, Bookmark, Plus } from "lucide-react";
import { toast } from "sonner";

interface TOCItem {
  title: string;
  page: number;
  level: number;
  children?: TOCItem[];
}

interface PDFTableOfContentsProps {
  fileUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  bookmarks?: Array<{ page: number; title: string; id: string }>;
  onAddBookmark?: (page: number, title: string) => void;
  onDeleteBookmark?: (id: string) => void;
}

export const PDFTableOfContents = ({
  fileUrl,
  currentPage,
  onPageChange,
  bookmarks = [],
  onAddBookmark,
  onDeleteBookmark,
}: PDFTableOfContentsProps) => {
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"toc" | "bookmarks">("toc");

  useEffect(() => {
    loadTableOfContents();
  }, [fileUrl]);

  const loadTableOfContents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch PDF file
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Try to extract outline (table of contents)
      // Note: pdf-lib has limited TOC support, this is a simplified version
      // For now, create a simple page-based TOC
      const pageCount = pdfDoc.getPageCount();
      const simpleTOC: TOCItem[] = [];
      
      for (let i = 0; i < pageCount; i++) {
        if (i % 10 === 0 || i === 0) {
          simpleTOC.push({
            title: `עמוד ${i + 1}${i === 0 ? " (תחילת המסמך)" : ""}`,
            page: i + 1,
            level: 0,
          });
        }
      }
      
      setTocItems(simpleTOC);
      
    } catch (err) {
      console.error("Error loading TOC:", err);
      setError("לא ניתן לטעון תוכן עניינים");
      setTocItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (itemKey: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }
      return next;
    });
  };

  const handleAddBookmark = () => {
    if (!onAddBookmark) return;
    
    const title = prompt("שם הסימניה:", `עמוד ${currentPage}`);
    if (title) {
      onAddBookmark(currentPage, title);
      toast.success("סימניה נוספה");
    }
  };

  const renderTOCItem = (item: TOCItem, index: number, parentKey = "") => {
    const itemKey = `${parentKey}-${index}`;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(itemKey);
    const isActive = currentPage === item.page;

    return (
      <div key={itemKey} className="select-none">
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all group ${
            isActive
              ? "bg-primary/20 text-primary font-medium"
              : "hover:bg-muted text-foreground"
          }`}
          style={{ paddingRight: `${item.level * 16 + 12}px` }}
          onClick={() => onPageChange(item.page)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(itemKey);
              }}
              className="p-0.5 hover:bg-primary/10 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronLeft className="w-3 h-3" />
              )}
            </button>
          )}
          <BookOpen className={`w-3.5 h-3.5 ${!hasChildren ? "mr-4" : ""}`} />
          <span className="flex-1 text-sm truncate">{item.title}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {item.page}
          </Badge>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children!.map((child, childIndex) =>
              renderTOCItem(child, childIndex, itemKey)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderBookmarks = () => {
    if (bookmarks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
          <Bookmark className="w-12 h-12 text-muted-foreground/50" />
          <div>
            <p className="text-sm font-medium">אין סימניות</p>
            <p className="text-xs text-muted-foreground">
              לחץ על + למעלה כדי להוסיף סימניה
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all group ${
              currentPage === bookmark.page
                ? "bg-primary/20 text-primary font-medium"
                : "hover:bg-muted text-foreground"
            }`}
            onClick={() => onPageChange(bookmark.page)}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span className="flex-1 text-sm truncate">{bookmark.title}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {bookmark.page}
            </Badge>
            {onDeleteBookmark && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBookmark(bookmark.id);
                }}
              >
                <span className="text-xs">×</span>
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col border-0 rounded-none shadow-none">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("toc")}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "toc"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-4 h-4" />
            תוכן עניינים
          </div>
        </button>
        <button
          onClick={() => setActiveTab("bookmarks")}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all relative ${
            activeTab === "bookmarks"
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Bookmark className="w-4 h-4" />
            סימניות
            {bookmarks.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {bookmarks.length}
              </Badge>
            )}
          </div>
        </button>
      </div>

      {/* Add Bookmark Button */}
      {activeTab === "bookmarks" && onAddBookmark && (
        <div className="p-2 border-b">
          <Button
            onClick={handleAddBookmark}
            variant="outline"
            size="sm"
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            הוסף סימניה לעמוד זה
          </Button>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {activeTab === "toc" ? (
            isLoading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">טוען תוכן עניינים...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium text-destructive">{error}</p>
                  <p className="text-xs text-muted-foreground">
                    ה-PDF לא מכיל תוכן עניינים מובנה
                  </p>
                </div>
              </div>
            ) : tocItems.length > 0 ? (
              <div className="space-y-1">
                {tocItems.map((item, index) => renderTOCItem(item, index))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium">אין תוכן עניינים</p>
                  <p className="text-xs text-muted-foreground">
                    ה-PDF לא מכיל תוכן עניינים מובנה
                  </p>
                </div>
              </div>
            )
          ) : (
            renderBookmarks()
          )}
        </div>
      </ScrollArea>

      {/* Footer Info */}
      {activeTab === "toc" && tocItems.length > 0 && !isLoading && (
        <div className="p-2 border-t text-center">
          <p className="text-xs text-muted-foreground">
            {tocItems.length} פריטים בתוכן העניינים
          </p>
        </div>
      )}
    </Card>
  );
};
