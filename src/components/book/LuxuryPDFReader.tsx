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
  Grid3X3,
  LayoutGrid,
  Rows3,
  PenTool,
  FileDown,
  Settings2,
  Edit3,
  Pin,
  PinOff,
  Columns,
  LayoutList,
} from "lucide-react";
import { usePDFAnnotations, type PDFAnnotation } from "@/hooks/usePDFAnnotations";
import { PDFFormOverlay } from "./PDFFormOverlay";
import { toast } from "sonner";
import { getRTLSelectedText } from "@/utils/rtlTextSelection";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

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
  const [indexViewMode, setIndexViewMode] = useState<"grid" | "list" | "compact" | "mini">("grid");
  const [sidePanelPinned, setSidePanelPinned] = useState(true);
  const [sidePanelWidth, setSidePanelWidth] = useState<"normal" | "wide" | "narrow">("normal");
  const [pdfDisplayMode, setPdfDisplayMode] = useState<"single" | "fit" | "wide">("single");
  const [pdfFrameSize, setPdfFrameSize] = useState<"small" | "medium" | "large" | "full">("medium");

  // Typography states
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("system-ui");
  
  // Reading mode states
  const [nightMode, setNightMode] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [showFormMode, setShowFormMode] = useState(false);
  const [pdfPageHeight, setPdfPageHeight] = useState(800);
  
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
  
  // Form filling - page-specific text inputs
  const [formInputs, setFormInputs] = useState<Record<string, Record<string, string>>>(() => {
    const saved = localStorage.getItem(`book-forms-${bookId}`);
    return saved ? JSON.parse(saved) : {};
  });

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
  
  // Save form inputs to localStorage
  useEffect(() => {
    localStorage.setItem(`book-forms-${bookId}`, JSON.stringify(formInputs));
  }, [formInputs, bookId]);

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

  // Text selection handler for highlighting - uses RTL-aware selection
  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        // Use RTL-aware text selection to fix reversed Hebrew text
        const rtlText = getRTLSelectedText();
        setSelectedText(rtlText || selection.toString().trim());
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
  
  // Export notes and progress
  const exportData = () => {
    const data = {
      bookName: fileName,
      exportDate: new Date().toLocaleDateString('he-IL'),
      progress: {
        currentPage,
        totalPages: numPages,
        readPages: [...readPages].sort((a, b) => a - b),
        percentage: progressPercentage
      },
      annotations: annotations.map(a => ({
        page: a.page_number,
        note: a.note_text,
        highlight: a.highlight_text,
        color: a.color,
        date: new Date(a.created_at).toLocaleDateString('he-IL')
      })),
      formInputs: formInputs[bookId] || {}
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace('.pdf', '')}_notes_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("הקובץ יוצא בהצלחה!");
  };
  
  // Export as text
  const exportAsText = () => {
    let text = `📖 ${fileName}\n`;
    text += `📅 תאריך ייצוא: ${new Date().toLocaleDateString('he-IL')}\n\n`;
    text += `📊 התקדמות קריאה: ${progressPercentage}% (${readCount}/${numPages} עמודים)\n`;
    text += `📍 עמוד נוכחי: ${currentPage}\n\n`;
    
    if (annotations.length > 0) {
      text += `📝 הערות והדגשות:\n${'─'.repeat(40)}\n`;
      annotations.forEach((a, i) => {
        text += `\n[${i + 1}] עמוד ${a.page_number}\n`;
        if (a.highlight_text) text += `   💡 "${a.highlight_text}"\n`;
        text += `   📌 ${a.note_text}\n`;
      });
    }
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace('.pdf', '')}_notes.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("הקובץ יוצא בהצלחה!");
  };

  // Calculate display width based on frame size and display mode
  const getDisplayWidth = () => {
    const baseWidth = pageWidth;
    const frameSizeMultiplier = 
      pdfFrameSize === "small" ? 0.6 :
      pdfFrameSize === "medium" ? 0.8 :
      pdfFrameSize === "large" ? 1.0 : 1.2;
    
    const displayModeMultiplier = 
      pdfDisplayMode === "fit" ? 1.1 :
      pdfDisplayMode === "wide" ? 1.3 : 1.0;
    
    return (baseWidth * frameSizeMultiplier * displayModeMultiplier * zoom) / 100;
  };

  const scaledWidth = getDisplayWidth();

  // Gold border style
  const goldBorderStyle = "ring-1 ring-primary/30 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]";

  return (
    <div 
      className={`flex flex-col h-[calc(100vh-100px)] min-h-[600px] rounded-xl overflow-hidden shadow-xl transition-colors ring-2 ring-primary/40 ${
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
          {/* Display Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="אפשרויות תצוגה" className="relative">
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
              <DropdownMenuLabel>גודל מסגרת</DropdownMenuLabel>
              <div className="grid grid-cols-4 gap-1 p-2">
                {[
                  { value: "small", label: "קטן", size: "60%" },
                  { value: "medium", label: "בינוני", size: "80%" },
                  { value: "large", label: "גדול", size: "100%" },
                  { value: "full", label: "מלא", size: "120%" },
                ].map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setPdfFrameSize(size.value as typeof pdfFrameSize)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                      pdfFrameSize === size.value
                        ? "bg-primary text-primary-foreground ring-2 ring-primary"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <div 
                      className={`border-2 rounded ${pdfFrameSize === size.value ? "border-primary-foreground" : "border-muted-foreground"}`}
                      style={{ 
                        width: size.value === "small" ? 16 : size.value === "medium" ? 20 : size.value === "large" ? 24 : 28,
                        height: size.value === "small" ? 20 : size.value === "medium" ? 26 : size.value === "large" ? 32 : 36
                      }}
                    />
                    <span className="text-[10px]">{size.label}</span>
                  </button>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>מצב תצוגה</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setPdfDisplayMode("single")} className="gap-2">
                <FileText className="w-4 h-4" />
                עמוד בודד
                {pdfDisplayMode === "single" && <Check className="w-3 h-3 mr-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPdfDisplayMode("fit")} className="gap-2">
                <Maximize2 className="w-4 h-4" />
                התאם לרוחב
                {pdfDisplayMode === "fit" && <Check className="w-3 h-3 mr-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPdfDisplayMode("wide")} className="gap-2">
                <Columns className="w-4 h-4" />
                תצוגה רחבה
                {pdfDisplayMode === "wide" && <Check className="w-3 h-3 mr-auto" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>זום מהיר</DropdownMenuLabel>
              <div className="grid grid-cols-4 gap-1 p-2">
                {[50, 75, 100, 150].map((z) => (
                  <Button
                    key={z}
                    variant={zoom === z ? "default" : "outline"}
                    size="sm"
                    onClick={() => setZoom(z)}
                    className="text-xs h-7"
                  >
                    {z}%
                  </Button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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

          {/* Form Fill Mode Toggle */}
          <Button
            variant={showFormMode ? "default" : "ghost"}
            size="icon"
            onClick={() => setShowFormMode(!showFormMode)}
            title="מצב מילוי טפסים"
            className={showFormMode ? "bg-primary text-primary-foreground" : ""}
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="ייצוא">
                <FileDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>ייצוא נתונים</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportAsText} className="gap-2">
                <FileText className="w-4 h-4" />
                ייצוא כטקסט (.txt)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportData} className="gap-2">
                <Download className="w-4 h-4" />
                ייצוא כ-JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href={fileUrl} download target="_blank" rel="noopener noreferrer" className="gap-2">
                  <Download className="w-4 h-4" />
                  הורד PDF מקורי
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
      <div 
        className="flex flex-1 overflow-hidden"
        onMouseLeave={() => {
          if (!sidePanelPinned && showSidePanel) {
            setShowSidePanel(false);
          }
        }}
      >
        {/* Side Panel Trigger (when unpinned and hidden) */}
        {!showSidePanel && !sidePanelPinned && (
          <div 
            className="w-2 bg-primary/10 hover:bg-primary/30 cursor-pointer transition-colors flex items-center justify-center"
            onMouseEnter={() => setShowSidePanel(true)}
          >
            <div className="w-1 h-16 bg-primary/40 rounded-full" />
          </div>
        )}

        {/* Side Panel */}
        {showSidePanel && (
          <div 
            className={`flex flex-col border-l-2 border-primary/20 transition-all shrink-0 ${
              nightMode ? "bg-slate-800" : "bg-card"
            } ${
              sidePanelWidth === "narrow" ? "w-64" : sidePanelWidth === "wide" ? "w-[28rem]" : "w-80"
            }`}
            onMouseEnter={() => !sidePanelPinned && setShowSidePanel(true)}
          >
            {/* Panel Header with controls */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-muted/30">
              <div className="flex gap-0.5">
                {/* Width controls */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" title="גודל פאנל">
                      <Columns className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover z-50">
                    <DropdownMenuLabel className="text-xs">רוחב פאנל</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSidePanelWidth("narrow")} className="gap-2 text-xs">
                      <LayoutList className="w-3.5 h-3.5" />
                      צר
                      {sidePanelWidth === "narrow" && <Check className="w-3 h-3 mr-auto" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSidePanelWidth("normal")} className="gap-2 text-xs">
                      <Columns className="w-3.5 h-3.5" />
                      רגיל
                      {sidePanelWidth === "normal" && <Check className="w-3 h-3 mr-auto" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSidePanelWidth("wide")} className="gap-2 text-xs">
                      <Maximize2 className="w-3.5 h-3.5" />
                      רחב
                      {sidePanelWidth === "wide" && <Check className="w-3 h-3 mr-auto" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex gap-0.5">
                {/* Pin toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSidePanelPinned(!sidePanelPinned)}
                  title={sidePanelPinned ? "בטל נעיצה (אוטו-הסתרה)" : "נעץ פאנל"}
                >
                  {sidePanelPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                </Button>
                {/* Close panel */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowSidePanel(false)}
                  title="סגור פאנל"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

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
                  className={`flex-1 px-1.5 py-2 text-[10px] font-medium transition-all flex flex-col items-center gap-0.5 ${
                    sidePanel === tab.id
                      ? "bg-primary/10 text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                {/* Page Index - ALL pages */}
                {sidePanel === "index" && (
                  <div className="space-y-2">
                    {/* Search and view toggle */}
                    <div className="flex gap-1.5 flex-wrap">
                      <div className="relative flex-1 min-w-[120px]">
                        <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="חפש עמוד..."
                          className="pr-8 text-xs h-8"
                        />
                      </div>
                      <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
                        <Button
                          variant={indexViewMode === "list" ? "default" : "ghost"}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setIndexViewMode("list")}
                          title="תצוגת רשימה"
                        >
                          <Rows3 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant={indexViewMode === "grid" ? "default" : "ghost"}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setIndexViewMode("grid")}
                          title="תצוגת רשת 5x"
                        >
                          <Grid3X3 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant={indexViewMode === "compact" ? "default" : "ghost"}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setIndexViewMode("compact")}
                          title="תצוגת רשת 10x"
                        >
                          <LayoutGrid className="w-3 h-3" />
                        </Button>
                        <Button
                          variant={indexViewMode === "mini" ? "default" : "ghost"}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setIndexViewMode("mini")}
                          title="תצוגה מינימלית"
                        >
                          <LayoutList className="w-3 h-3" />
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
                    {indexViewMode === "grid" && (
                      <div className="grid grid-cols-5 gap-1.5">
                        {filteredPages.map((page) => {
                          const hasAnnotations = annotationCountsByPage[page] > 0;
                          const isActive = page === currentPage;
                          const isRead = readPages.has(page);

                          return (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`relative aspect-square flex items-center justify-center text-xs font-medium rounded-lg transition-all ring-1 ring-primary/20 ${
                                isActive
                                  ? "bg-primary text-primary-foreground shadow-md scale-110 z-10 ring-2 ring-primary"
                                  : isRead
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 ring-green-400/30"
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
                    )}

                    {/* List View */}
                    {indexViewMode === "list" && (
                      <div className="space-y-1">
                        {filteredPages.map((page) => {
                          const hasAnnotations = annotationCountsByPage[page] > 0;
                          const isActive = page === currentPage;
                          const isRead = readPages.has(page);

                          return (
                            <div
                              key={page}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all border border-primary/10 ${
                                isActive
                                  ? "bg-primary text-primary-foreground shadow-md border-primary"
                                  : isRead
                                  ? "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-green-400/30"
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

                    {/* Compact View - 10 columns */}
                    {indexViewMode === "compact" && (
                      <div className="grid grid-cols-10 gap-0.5">
                        {filteredPages.map((page) => {
                          const hasAnnotations = annotationCountsByPage[page] > 0;
                          const isActive = page === currentPage;
                          const isRead = readPages.has(page);

                          return (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`relative aspect-square flex items-center justify-center text-[9px] font-medium rounded transition-all ${
                                isActive
                                  ? "bg-primary text-primary-foreground shadow ring-1 ring-primary"
                                  : isRead
                                  ? "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
                                  : "bg-muted/60 hover:bg-muted"
                              }`}
                              title={`עמוד ${page}`}
                            >
                              {page}
                              {hasAnnotations && (
                                <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-primary rounded-full" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Mini View - single row of numbers */}
                    {indexViewMode === "mini" && (
                      <div className="flex flex-wrap gap-0.5">
                        {filteredPages.map((page) => {
                          const hasAnnotations = annotationCountsByPage[page] > 0;
                          const isActive = page === currentPage;
                          const isRead = readPages.has(page);

                          return (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`w-6 h-5 flex items-center justify-center text-[8px] font-medium rounded transition-all ${
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : isRead
                                  ? "bg-green-300 dark:bg-green-700 text-green-900 dark:text-green-100"
                                  : hasAnnotations
                                  ? "bg-amber-200 dark:bg-amber-800"
                                  : "bg-muted/40 hover:bg-muted"
                              }`}
                              title={`עמוד ${page}`}
                            >
                              {page}
                            </button>
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
                            <CollapsibleTrigger asChild>
                              <div
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
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
                                <span
                                  role="button"
                                  tabIndex={0}
                                  className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted/80"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    goToPage(page);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.stopPropagation();
                                      goToPage(page);
                                    }
                                  }}
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                </span>
                              </div>
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

              {/* PDF with gold frame */}
              <div className="relative ring-2 ring-primary/30 rounded-lg shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)] overflow-hidden">
                <Document
                  file={fileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={null}
                  className={`${nightMode ? "filter brightness-90 contrast-110" : ""}`}
                >
                  <Page
                    pageNumber={currentPage}
                    width={scaledWidth}
                    loading={
                      <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    }
                    className="bg-white pdf-page-with-highlights"
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    onRenderSuccess={(page) => {
                      setPdfPageHeight(page.height * (scaledWidth / page.width));
                    }}
                  />
                </Document>

                {/* Highlights Overlay - visual indicators for saved highlights */}
                {getPageAnnotations(currentPage).filter(a => a.highlight_text).length > 0 && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {getPageAnnotations(currentPage)
                        .filter(a => a.highlight_text)
                        .map((annotation) => (
                          <div
                            key={annotation.id}
                            className="px-2 py-1 rounded text-xs font-medium cursor-pointer hover:scale-105 transition-transform shadow-sm"
                            style={{ 
                              backgroundColor: annotation.color || '#FFEB3B',
                              color: '#000'
                            }}
                            title={`"${annotation.highlight_text}" - ${annotation.note_text}`}
                            onClick={() => {
                              setSidePanel("annotations");
                              setShowSidePanel(true);
                            }}
                          >
                            <Highlighter className="w-3 h-3 inline mr-1" />
                            {(annotation.highlight_text?.length || 0) > 15 
                              ? annotation.highlight_text?.substring(0, 15) + '...' 
                              : annotation.highlight_text}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Form Overlay */}
                {showFormMode && (
                  <PDFFormOverlay
                    pageNumber={currentPage}
                    bookId={bookId}
                    width={scaledWidth}
                    height={pdfPageHeight}
                    onClose={() => setShowFormMode(false)}
                  />
                )}
              </div>
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
