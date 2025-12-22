import { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Trash2,
  Plus,
  MessageSquare,
  FileText,
  Download,
  List,
  Maximize2,
  Highlighter,
  BookOpen,
  ChevronDown,
  Loader2,
  Search,
  X,
  Moon,
  Sun,
  PanelRightOpen,
  PanelRightClose,
  Check,
  BookMarked,
  CheckCircle2,
  Circle,
  Eye,
} from "lucide-react";
import { usePDFAnnotations, type PDFAnnotation } from "@/hooks/usePDFAnnotations";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface LuxuryPDFReaderProps {
  bookId: string;
  fileUrl: string;
  fileName: string;
  currentPage: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  onTotalPagesChange?: (total: number) => void;
  onDelete: () => void;
  onBack: () => void;
}

const HIGHLIGHT_COLORS = [
  { value: "#FFEB3B", label: "צהוב", className: "bg-yellow-400" },
  { value: "#81C784", label: "ירוק", className: "bg-green-400" },
  { value: "#64B5F6", label: "כחול", className: "bg-blue-400" },
  { value: "#FF8A65", label: "כתום", className: "bg-orange-400" },
  { value: "#CE93D8", label: "סגול", className: "bg-purple-400" },
  { value: "#F48FB1", label: "ורוד", className: "bg-pink-400" },
];

const FONT_OPTIONS = [
  { value: "system-ui", label: "מערכת" },
  { value: "'David Libre', serif", label: "דוד" },
  { value: "'Frank Ruhl Libre', serif", label: "פרנק רוהל" },
  { value: "'Heebo', sans-serif", label: "היבו" },
  { value: "'Rubik', sans-serif", label: "רוביק" },
  { value: "'Assistant', sans-serif", label: "אסיסטנט" },
];

export const LuxuryPDFReader = ({
  bookId,
  fileUrl,
  fileName,
  currentPage,
  totalPages: initialTotalPages = 100,
  onPageChange,
  onTotalPagesChange,
  onDelete,
  onBack,
}: LuxuryPDFReaderProps) => {
  // PDF states
  const [numPages, setNumPages] = useState<number>(initialTotalPages);
  const [pageWidth, setPageWidth] = useState<number>(1000);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // View states
  const [zoom, setZoom] = useState(100);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [sidePanel, setSidePanel] = useState<"index" | "progress" | "annotations" | "settings">("index");
  const [searchQuery, setSearchQuery] = useState("");
  const [indexViewMode, setIndexViewMode] = useState<"all" | "grid">("all");

  // Typography states
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("system-ui");
  
  // Reading mode states
  const [nightMode, setNightMode] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  
  // Reading progress - pages that have been read
  const [readPages, setReadPages] = useState<Set<number>>(() => {
    const saved = localStorage.getItem(`book-progress-${bookId}`);
    return saved ? new Set(JSON.parse(saved)) : new Set<number>();
  });

  // Annotation states
  const [newNote, setNewNote] = useState("");
  const [newHighlight, setNewHighlight] = useState("");
  const [selectedColor, setSelectedColor] = useState("#FFEB3B");
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([currentPage]));

  const containerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const {
    annotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    getPageAnnotations,
    annotationCountsByPage,
  } = usePDFAnnotations(bookId);

  // Save read pages to localStorage
  useEffect(() => {
    localStorage.setItem(`book-progress-${bookId}`, JSON.stringify([...readPages]));
  }, [readPages, bookId]);

  // Mark current page as read when viewing
  useEffect(() => {
    if (currentPage > 0) {
      setReadPages(prev => new Set(prev).add(currentPage));
    }
  }, [currentPage]);

  // Resize handler - wider default width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Use more of the available width
        const width = showSidePanel ? containerWidth - 320 - 32 : containerWidth - 32;
        setPageWidth(Math.min(Math.max(width, 600), 1400));
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [showSidePanel]);

  // Text selection handler for highlighting
  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        setSelectedText(selection.toString().trim());
      }
    };

    document.addEventListener("mouseup", handleTextSelection);
    return () => document.removeEventListener("mouseup", handleTextSelection);
  }, []);

  // Save highlight from selected text
  const handleSaveHighlight = () => {
    if (!selectedText) return;
    
    addAnnotation.mutate(
      {
        bookId,
        pageNumber: currentPage,
        noteText: `הדגשה: ${selectedText}`,
        highlightText: selectedText,
        color: selectedColor,
      },
      {
        onSuccess: () => {
          toast.success("ההדגשה נשמרה!");
          setSelectedText("");
          window.getSelection()?.removeAllRanges();
        },
      }
    );
  };

  // PDF handlers
  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setIsLoading(false);
      setPdfError(null);
      onTotalPagesChange?.(numPages);
    },
    [onTotalPagesChange]
  );

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("PDF load error:", error);
    setPdfError("שגיאה בטעינת הקובץ");
    setIsLoading(false);
  }, []);

  // Group annotations by page
  const annotationsByPage = annotations.reduce((acc, ann) => {
    if (!acc[ann.page_number]) acc[ann.page_number] = [];
    acc[ann.page_number].push(ann);
    return acc;
  }, {} as Record<number, PDFAnnotation[]>);

  const pagesWithAnnotations = Object.keys(annotationsByPage)
    .map(Number)
    .sort((a, b) => a - b);

  // Handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  const handleAddAnnotation = () => {
    if (!newNote.trim()) {
      toast.error("נא להזין תוכן להערה");
      return;
    }

    addAnnotation.mutate(
      {
        bookId,
        pageNumber: currentPage,
        noteText: newNote,
        highlightText: newHighlight || undefined,
        color: selectedColor,
      },
      {
        onSuccess: () => {
          toast.success("ההערה נשמרה!");
          setNewNote("");
          setNewHighlight("");
          setExpandedGroups((prev) => new Set(prev).add(currentPage));
        },
      }
    );
  };

  const handleUpdateAnnotation = (annotationId: string) => {
    if (!editText.trim()) return;

    updateAnnotation.mutate(
      { annotationId, noteText: editText },
      {
        onSuccess: () => {
          toast.success("ההערה עודכנה");
          setEditingAnnotation(null);
          setEditText("");
        },
      }
    );
  };

  const handleDeleteAnnotation = (annotationId: string) => {
    deleteAnnotation.mutate({ annotationId }, { onSuccess: () => toast.success("ההערה נמחקה") });
  };

  const togglePageGroup = (page: number) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(page)) {
        newSet.delete(page);
      } else {
        newSet.add(page);
      }
      return newSet;
    });
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      onPageChange(page);
      setExpandedGroups((prev) => new Set(prev).add(page));
    }
  };

  // Generate page index - ALL pages, no skipping
  const allPages = Array.from({ length: numPages }, (_, i) => i + 1);
  const filteredPages = searchQuery
    ? allPages.filter(
        (p) =>
          p.toString().includes(searchQuery) ||
          (annotationCountsByPage[p] > 0 && `עמוד ${p}`.includes(searchQuery))
      )
    : allPages; // Show ALL pages, not just every 5th
  
  // Reading progress calculation
  const readCount = readPages.size;
  const progressPercentage = numPages > 0 ? Math.round((readCount / numPages) * 100) : 0;
  
  // Toggle page as read/unread
  const togglePageRead = (page: number) => {
    setReadPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(page)) {
        newSet.delete(page);
      } else {
        newSet.add(page);
      }
      return newSet;
    });
  };
  
  // Mark all pages up to current as read
  const markAllUpToCurrentAsRead = () => {
    setReadPages(prev => {
      const newSet = new Set(prev);
      for (let i = 1; i <= currentPage; i++) {
        newSet.add(i);
      }
      return newSet;
    });
    toast.success(`סומנו ${currentPage} עמודים כנקראו`);
  };
  
  // Clear all read progress
  const clearReadProgress = () => {
    setReadPages(new Set());
    toast.success("התקדמות הקריאה אופסה");
  };

  const scaledWidth = (pageWidth * zoom) / 100;

  return (
    <div 
      className={`flex flex-col h-[calc(100vh-100px)] min-h-[600px] rounded-xl overflow-hidden border-2 border-border shadow-xl transition-colors ${
        nightMode ? "bg-slate-900" : "bg-background"
      }`} 
      dir="rtl"
    >
      {/* Floating Highlight Bar */}
      {selectedText && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-card border-2 border-primary shadow-2xl rounded-2xl p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-muted-foreground">הדגש טקסט:</span>
          <div className="flex gap-1.5">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  selectedColor === color.value
                    ? "border-foreground scale-110 ring-2 ring-offset-1 ring-primary"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
          <Button size="sm" onClick={handleSaveHighlight} className="gap-1">
            <Check className="w-4 h-4" />
            שמור
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedText("")}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Top Header */}
      <div className={`flex items-center justify-between p-3 border-b-2 border-primary/20 ${nightMode ? "bg-slate-800" : "bg-card"}`}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 hover:bg-primary/10">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">חזרה</span>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold truncate max-w-[200px] text-sm">{fileName}</h3>
              <p className="text-xs text-muted-foreground">
                עמוד {currentPage} / {numPages}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Night Mode */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNightMode(!nightMode)}
            title={nightMode ? "מצב יום" : "מצב לילה"}
          >
            {nightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Zoom Controls */}
          <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 50} className="h-7 w-7">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 200} className="h-7 w-7">
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" onClick={() => setShowFullscreen(true)} title="מסך מלא">
            <Maximize2 className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="icon" asChild title="הורד">
            <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4" />
            </a>
          </Button>

          <Button
            variant={showSidePanel ? "default" : "ghost"}
            size="icon"
            onClick={() => setShowSidePanel(!showSidePanel)}
            title="פאנל צדדי"
          >
            {showSidePanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={onDelete}
            title="מחק"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Side Panel */}
        {showSidePanel && (
          <div className={`w-80 lg:w-96 border-l-2 border-primary/20 flex flex-col ${nightMode ? "bg-slate-800" : "bg-card"}`}>
            {/* Panel Tabs */}
            <div className="flex border-b border-border">
              {[
                { id: "index", icon: List, label: "אינדקס" },
                { id: "progress", icon: BookMarked, label: "מעקב" },
                { id: "annotations", icon: MessageSquare, label: "הערות" },
                { id: "settings", icon: Eye, label: "תצוגה" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSidePanel(tab.id as typeof sidePanel)}
                  className={`flex-1 px-1.5 py-2.5 text-[10px] font-medium transition-all flex flex-col items-center gap-0.5 ${
                    sidePanel === tab.id
                      ? "bg-primary/10 text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3">
                {/* Page Index - ALL pages */}
                {sidePanel === "index" && (
                  <div className="space-y-3">
                    {/* Search and view toggle */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="חפש עמוד..."
                          className="pr-9 text-sm"
                        />
                      </div>
                      <div className="flex gap-1 bg-muted rounded-lg p-1">
                        <Button
                          variant={indexViewMode === "all" ? "default" : "ghost"}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setIndexViewMode("all")}
                          title="תצוגת רשימה"
                        >
                          <List className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant={indexViewMode === "grid" ? "default" : "ghost"}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setIndexViewMode("grid")}
                          title="תצוגת רשת"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"/>
                          </svg>
                        </Button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">התקדמות קריאה</span>
                        <span className="font-medium text-primary">{progressPercentage}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                      <p className="text-[10px] text-muted-foreground">
                        {readCount} מתוך {numPages} עמודים נקראו
                      </p>
                    </div>

                    {/* Grid View */}
                    {indexViewMode === "grid" ? (
                      <div className="grid grid-cols-5 gap-1.5">
                        {filteredPages.map((page) => {
                          const hasAnnotations = annotationCountsByPage[page] > 0;
                          const isActive = page === currentPage;
                          const isRead = readPages.has(page);

                          return (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`relative aspect-square flex items-center justify-center text-xs font-medium rounded-lg transition-all ${
                                isActive
                                  ? "bg-primary text-primary-foreground shadow-md scale-110 z-10"
                                  : isRead
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                              title={`עמוד ${page}${isRead ? " (נקרא)" : ""}${hasAnnotations ? ` - ${annotationCountsByPage[page]} הערות` : ""}`}
                            >
                              {page}
                              {hasAnnotations && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full" />
                              )}
                              {isRead && !isActive && (
                                <CheckCircle2 className="absolute -bottom-0.5 -left-0.5 w-3 h-3 text-green-600" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      /* List View */
                      <div className="space-y-1">
                        {filteredPages.map((page) => {
                          const hasAnnotations = annotationCountsByPage[page] > 0;
                          const isActive = page === currentPage;
                          const isRead = readPages.has(page);

                          return (
                            <div
                              key={page}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all ${
                                isActive
                                  ? "bg-primary text-primary-foreground shadow-md"
                                  : isRead
                                  ? "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
                                  : "hover:bg-muted"
                              }`}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePageRead(page);
                                }}
                                className={`shrink-0 ${isActive ? "text-primary-foreground" : ""}`}
                              >
                                {isRead ? (
                                  <CheckCircle2 className={`w-4 h-4 ${isActive ? "" : "text-green-600"}`} />
                                ) : (
                                  <Circle className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                              <button
                                onClick={() => goToPage(page)}
                                className="flex-1 text-right font-medium"
                              >
                                עמוד {page}
                              </button>
                              {hasAnnotations && (
                                <Badge variant={isActive ? "outline" : "secondary"} className="text-[10px] gap-0.5 h-5">
                                  <MessageSquare className="w-2.5 h-2.5" />
                                  {annotationCountsByPage[page]}
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Reading Progress Panel */}
                {sidePanel === "progress" && (
                  <div className="space-y-4">
                    {/* Progress Overview */}
                    <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                      <div className="text-center space-y-3">
                        <div className="relative w-24 h-24 mx-auto">
                          <svg className="w-24 h-24 -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              strokeWidth="8"
                              fill="none"
                              className="stroke-muted"
                            />
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={251.2}
                              strokeDashoffset={251.2 - (251.2 * progressPercentage) / 100}
                              className="stroke-primary transition-all duration-500"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-primary">{progressPercentage}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{readCount} עמודים נקראו</p>
                          <p className="text-sm text-muted-foreground">מתוך {numPages} עמודים</p>
                        </div>
                      </div>
                    </Card>

                    {/* Quick Actions */}
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full gap-2 justify-start"
                        onClick={markAllUpToCurrentAsRead}
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        סמן הכל עד עמוד {currentPage} כנקרא
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full gap-2 justify-start text-destructive hover:bg-destructive/10"
                        onClick={clearReadProgress}
                      >
                        <X className="w-4 h-4" />
                        אפס התקדמות קריאה
                      </Button>
                    </div>

                    {/* Current Position */}
                    <Card className="p-3">
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        המיקום הנוכחי
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          עמוד {currentPage}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {numPages - currentPage} עמודים נותרו
                        </span>
                      </div>
                    </Card>

                    {/* Unread Pages */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">עמודים שלא נקראו</p>
                      <div className="grid grid-cols-6 gap-1">
                        {allPages.filter(p => !readPages.has(p)).slice(0, 30).map((page) => (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`aspect-square flex items-center justify-center text-[10px] font-medium rounded transition-all ${
                              page === currentPage
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        {allPages.filter(p => !readPages.has(p)).length > 30 && (
                          <div className="col-span-6 text-center text-xs text-muted-foreground py-1">
                            ועוד {allPages.filter(p => !readPages.has(p)).length - 30} עמודים...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Annotations Panel */}
                {sidePanel === "annotations" && (
                  <div className="space-y-4">
                    {/* Add new annotation */}
                    <Card className="p-3 border-2 border-dashed border-primary/30">
                      <p className="text-sm font-medium flex items-center gap-2 mb-3">
                        <Plus className="w-4 h-4 text-primary" />
                        הוסף הערה לעמוד {currentPage}
                      </p>

                      <div className="space-y-2">
                        <Textarea
                          value={newHighlight}
                          onChange={(e) => setNewHighlight(e.target.value)}
                          placeholder="טקסט מסומן (אופציונלי)..."
                          rows={2}
                          className="text-sm resize-none"
                        />

                        <Textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="כתוב הערה..."
                          rows={2}
                          className="text-sm resize-none"
                        />

                        {/* Color Picker */}
                        <div className="flex items-center gap-2">
                          <Highlighter className="w-4 h-4 text-muted-foreground" />
                          <div className="flex gap-1.5">
                            {HIGHLIGHT_COLORS.map((color) => (
                              <button
                                key={color.value}
                                onClick={() => setSelectedColor(color.value)}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${
                                  selectedColor === color.value
                                    ? "border-foreground scale-110 ring-2 ring-offset-1 ring-primary"
                                    : "border-transparent hover:scale-105"
                                }`}
                                style={{ backgroundColor: color.value }}
                                title={color.label}
                              />
                            ))}
                          </div>
                        </div>

                        <Button
                          onClick={handleAddAnnotation}
                          className="w-full gap-2"
                          size="sm"
                          disabled={!newNote.trim() || addAnnotation.isPending}
                        >
                          <Plus className="w-4 h-4" />
                          הוסף הערה
                        </Button>
                      </div>
                    </Card>

                    {/* Existing annotations */}
                    {pagesWithAnnotations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">אין הערות עדיין</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pagesWithAnnotations.map((page) => (
                          <Collapsible
                            key={page}
                            open={expandedGroups.has(page)}
                            onOpenChange={() => togglePageGroup(page)}
                          >
                            <CollapsibleTrigger
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${
                                page === currentPage ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform ${
                                    expandedGroups.has(page) ? "" : "-rotate-90"
                                  }`}
                                />
                                <span className="font-medium">עמוד {page}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {annotationsByPage[page].length}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  goToPage(page);
                                }}
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </Button>
                            </CollapsibleTrigger>

                            <CollapsibleContent className="pr-4 mt-2 space-y-2">
                              {annotationsByPage[page].map((annotation) => (
                                <Card
                                  key={annotation.id}
                                  className="p-3 border-r-4"
                                  style={{ borderRightColor: annotation.color || "#FFEB3B" }}
                                >
                                  {annotation.highlight_text && (
                                    <p
                                      className="text-xs mb-2 p-2 rounded"
                                      style={{ backgroundColor: `${annotation.color}30` }}
                                    >
                                      "{annotation.highlight_text}"
                                    </p>
                                  )}

                                  {editingAnnotation === annotation.id ? (
                                    <div className="space-y-2">
                                      <Textarea
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        rows={2}
                                        className="text-sm"
                                      />
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleUpdateAnnotation(annotation.id)}>
                                          שמור
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setEditingAnnotation(null);
                                            setEditText("");
                                          }}
                                        >
                                          ביטול
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-sm">{annotation.note_text}</p>
                                      <div className="flex gap-2 mt-2">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 px-2 text-xs"
                                          onClick={() => {
                                            setEditingAnnotation(annotation.id);
                                            setEditText(annotation.note_text);
                                          }}
                                        >
                                          ערוך
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 px-2 text-xs text-destructive"
                                          onClick={() => handleDeleteAnnotation(annotation.id)}
                                        >
                                          מחק
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </Card>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Settings Panel */}
                {sidePanel === "settings" && (
                  <div className="space-y-6">
                    {/* Night Mode Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <label className="text-sm font-medium flex items-center gap-2">
                        {nightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        מצב לילה
                      </label>
                      <Switch checked={nightMode} onCheckedChange={setNightMode} />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <ZoomIn className="w-4 h-4" />
                        זום
                      </label>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 50}>
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <Slider
                          value={[zoom]}
                          onValueChange={([val]) => setZoom(val)}
                          min={50}
                          max={200}
                          step={10}
                          className="flex-1"
                        />
                        <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 200}>
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-center">
                        <Badge variant="outline">{zoom}%</Badge>
                      </div>
                    </div>

                    {/* Quick Zoom Presets */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">זום מהיר</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[75, 100, 125, 150].map((z) => (
                          <Button
                            key={z}
                            variant={zoom === z ? "default" : "outline"}
                            size="sm"
                            onClick={() => setZoom(z)}
                            className="text-xs"
                          >
                            {z}%
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Highlighter className="w-4 h-4" />
                        צבע הדגשה ברירת מחדל
                      </label>
                      <div className="flex gap-2 justify-center">
                        {HIGHLIGHT_COLORS.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setSelectedColor(color.value)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              selectedColor === color.value
                                ? "border-foreground scale-110 ring-2 ring-offset-2 ring-primary"
                                : "border-transparent hover:scale-105"
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Tip Card */}
                    <Card className="p-4 bg-primary/5 border-primary/20">
                      <p className="text-sm font-medium flex items-center gap-2 mb-2">
                        <Highlighter className="w-4 h-4 text-primary" />
                        טיפ להדגשה
                      </p>
                      <p className="text-xs text-muted-foreground">
                        סמנו טקסט על ה-PDF ותופיע אפשרות להדגשה ושמירה אוטומטית.
                      </p>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* PDF Viewer */}
        <div 
          ref={containerRef} 
          className={`flex-1 flex flex-col overflow-hidden transition-colors ${
            nightMode 
              ? "bg-gradient-to-b from-slate-800 to-slate-900" 
              : "bg-gradient-to-b from-muted/20 to-muted/40"
          }`}
        >
          {/* PDF Content - with proper scrolling */}
          <div 
            ref={pdfContainerRef}
            className="flex-1 overflow-y-auto overflow-x-auto"
            style={{ 
              minHeight: 0, // Important for flex scroll
            }}
          >
            <div className="flex justify-center py-6 px-4 min-h-full">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <p className={nightMode ? "text-slate-300" : "text-muted-foreground"}>טוען את הספר...</p>
                </div>
              )}

              {pdfError && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                  <FileText className="w-16 h-16 text-muted-foreground" />
                  <p className="text-destructive font-medium">{pdfError}</p>
                  <Button asChild>
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      פתח בחלון חדש
                    </a>
                  </Button>
                </div>
              )}

              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={null}
                className={`shadow-2xl rounded-lg overflow-hidden ${nightMode ? "filter brightness-90 contrast-110" : ""}`}
              >
                <Page
                  pageNumber={currentPage}
                  width={scaledWidth}
                  loading={
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  }
                  className="bg-white"
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className={`flex items-center justify-between p-3 border-t-2 border-primary/20 ${nightMode ? "bg-slate-800" : "bg-card"}`}>
            <Button
              variant="outline"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="gap-2"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">הקודם</span>
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goToPage(Math.max(1, currentPage - 10))}
                disabled={currentPage <= 1}
                className="hidden sm:flex"
              >
                -10
              </Button>
              
              <Input
                type="number"
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-16 text-center text-sm"
                min={1}
                max={numPages}
                dir="ltr"
              />
              <span className={`text-sm hidden sm:inline ${nightMode ? "text-slate-400" : "text-muted-foreground"}`}>
                / {numPages}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goToPage(Math.min(numPages, currentPage + 10))}
                disabled={currentPage >= numPages}
                className="hidden sm:flex"
              >
                +10
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
              className="gap-2"
            >
              <span className="hidden sm:inline">הבא</span>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] w-full h-full p-2" dir="rtl">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              {fileName}
              <span className="text-muted-foreground text-xs">עמוד {currentPage} / {numPages}</span>
              <Button variant="ghost" size="icon" className="mr-auto h-7 w-7" onClick={() => setShowFullscreen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className={`flex-1 overflow-auto flex justify-center py-4 rounded-lg ${nightMode ? "bg-slate-900" : "bg-muted/30"}`}>
            <Document file={fileUrl} loading={null}>
              <Page 
                pageNumber={currentPage} 
                width={Math.min(window.innerWidth * 0.92, 1400)}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          </div>
          
          {/* Fullscreen Navigation */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <Button
              variant="outline"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronRight className="w-4 h-4" />
              הקודם
            </Button>
            <span className="text-sm">{currentPage} / {numPages}</span>
            <Button
              variant="outline"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= numPages}
            >
              הבא
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
