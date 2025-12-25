import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Loader2,
  FileSearch,
} from "lucide-react";
import { toast } from "sonner";
import * as pdfjs from "pdfjs-dist";

interface SearchResult {
  page: number;
  text: string;
  matchIndex: number;
  context: string;
}

interface PDFSearchBarProps {
  fileUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onHighlightSearch?: (results: SearchResult[]) => void;
}

export const PDFSearchBar = ({
  fileUrl,
  currentPage,
  onPageChange,
  onHighlightSearch,
}: PDFSearchBarProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (query.trim().length >= 2) {
      const debounce = setTimeout(() => {
        performSearch(query);
      }, 500);
      return () => clearTimeout(debounce);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowResults(true);

    try {
      // Load PDF
      const pdf = await pdfjs.getDocument(fileUrl).promise;
      const searchResults: SearchResult[] = [];
      const searchLower = searchQuery.toLowerCase();

      // Search through all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine all text items
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");

        // Find all matches in the page
        const pageLower = pageText.toLowerCase();
        let matchIndex = 0;
        let index = pageLower.indexOf(searchLower, matchIndex);

        while (index !== -1) {
          // Extract context (50 chars before and after)
          const contextStart = Math.max(0, index - 50);
          const contextEnd = Math.min(pageText.length, index + searchQuery.length + 50);
          const context = pageText.substring(contextStart, contextEnd);

          searchResults.push({
            page: pageNum,
            text: searchQuery,
            matchIndex: searchResults.length,
            context: `...${context}...`,
          });

          matchIndex = index + searchQuery.length;
          index = pageLower.indexOf(searchLower, matchIndex);
        }
      }

      setResults(searchResults);
      setCurrentResultIndex(0);

      if (searchResults.length > 0) {
        toast.success(`נמצאו ${searchResults.length} תוצאות`);
        onHighlightSearch?.(searchResults);
      } else {
        toast.info("לא נמצאו תוצאות");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("שגיאה בחיפוש");
    } finally {
      setIsSearching(false);
    }
  };

  const goToResult = (index: number) => {
    if (results.length === 0) return;
    
    const result = results[index];
    setCurrentResultIndex(index);
    onPageChange(result.page);
  };

  const goToNext = () => {
    if (results.length === 0) return;
    const nextIndex = (currentResultIndex + 1) % results.length;
    goToResult(nextIndex);
  };

  const goToPrevious = () => {
    if (results.length === 0) return;
    const prevIndex = (currentResultIndex - 1 + results.length) % results.length;
    goToResult(prevIndex);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    setCurrentResultIndex(0);
    onHighlightSearch?.([]);
  };

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="חפש בקובץ PDF..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pr-10 pl-10"
            dir="rtl"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isSearching && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
      </div>

      {/* Navigation */}
      {results.length > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {currentResultIndex + 1} / {results.length}
          </Badge>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={goToPrevious}
              disabled={results.length === 0}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={goToNext}
              disabled={results.length === 0}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs h-7"
          >
            נקה
          </Button>
        </div>
      )}

      {/* Results List */}
      {showResults && query && (
        <Card className="border">
          <div className="p-3 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <FileSearch className="w-4 h-4" />
                תוצאות חיפוש
              </span>
              {results.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {results.length} תוצאות
                </Badge>
              )}
            </div>
          </div>

          <ScrollArea className="h-64">
            {isSearching ? (
              <div className="flex items-center justify-center h-32 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">מחפש...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="p-2 space-y-1">
                {results.map((result, index) => (
                  <div
                    key={`${result.page}-${result.matchIndex}`}
                    onClick={() => goToResult(index)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      index === currentResultIndex
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        עמוד {result.page}
                      </Badge>
                      {index === currentResultIndex && (
                        <Badge variant="default" className="text-xs">
                          נוכחי
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2" dir="auto">
                      {result.context.split(new RegExp(`(${query})`, "gi")).map((part, i) =>
                        part.toLowerCase() === query.toLowerCase() ? (
                          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">
                            {part}
                          </mark>
                        ) : (
                          <span key={i}>{part}</span>
                        )
                      )}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
                <FileSearch className="w-8 h-8 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium">לא נמצאו תוצאות</p>
                  <p className="text-xs text-muted-foreground">
                    נסה מילות חיפוש אחרות
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </Card>
      )}
    </div>
  );
};
