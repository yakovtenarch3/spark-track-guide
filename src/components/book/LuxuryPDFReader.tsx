import { useState, useCallback, useRef, useEffect } from "react";
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
  Edit3,
  FileDown,
  Pin,
  PinOff,
  Columns,
  LayoutList,
} from "lucide-react";
import { usePDFAnnotations, type PDFAnnotation } from "@/hooks/usePDFAnnotations";
import { PDFFormOverlay } from "./PDFFormOverlay";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  PDFHighlighterComponent,
  CustomHighlight,
  convertAnnotationToHighlight,
  convertHighlightToAnnotation,
  HIGHLIGHT_COLORS,
} from "./PDFHighlighter";

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
  const [isLoading, setIsLoading] = useState(true);

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
  const [showFormMode, setShowFormMode] = useState(false);
  
  // Annotation states
  const [newNote, setNewNote] = useState("");
  const [newHighlight, setNewHighlight] = useState("");
  const [selectedColor, setSelectedColor] = useState("#FFEB3B");
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([currentPage]));
  
  // Reading progress - pages that have been read
  const [readPages, setReadPages] = useState<Set<number>>(() => {
    const saved = localStorage.getItem(`book-progress-${bookId}`);
    return saved ? new Set(JSON.parse(saved)) : new Set<number>();
  });

  // Form filling - page-specific text inputs
  const [formInputs, setFormInputs] = useState<Record<string, Record<string, string>>>(() => {
    const saved = localStorage.getItem(`book-forms-${bookId}`);
    return saved ? JSON.parse(saved) : {};
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    annotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    getPageAnnotations,
    annotationCountsByPage,
  } = usePDFAnnotations(bookId);
  
  // Convert database annotations to library format
  const libraryHighlights: CustomHighlight[] = annotations
    .map(convertAnnotationToHighlight)
    .filter((h): h is CustomHighlight => h !== null);

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

  // Handle highlight from new library
  const handleAddLibraryHighlight = useCallback((highlight: CustomHighlight) => {
    const annotationData = convertHighlightToAnnotation(highlight, bookId);
    addAnnotation.mutate({
      bookId: annotationData.bookId,
      pageNumber: annotationData.pageNumber,
      noteText: annotationData.noteText,
      highlightText: annotationData.highlightText,
      color: annotationData.color,
      highlightRects: annotationData.highlightRects,
    });
  }, [addAnnotation, bookId]);

  const handleDeleteLibraryHighlight = useCallback((id: string) => {
    deleteAnnotation.mutate({ annotationId: id });
  }, [deleteAnnotation]);

  const handleUpdateLibraryHighlight = useCallback((id: string, updates: Partial<CustomHighlight>) => {
    updateAnnotation.mutate({ 
      annotationId: id, 
      color: updates.color,
      noteText: updates.noteText,
    });
  }, [updateAnnotation]);

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
    : allPages;
  
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

  return (
    <div 
      className={`flex flex-col h-[calc(100vh-100px)] min-h-[600px] rounded-xl overflow-hidden shadow-xl transition-colors ring-2 ring-primary/40 ${
        nightMode ? "bg-slate-900" : "bg-background"
      }`} 
      dir="rtl"
    >
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
                {annotations.length} הדגשות
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
      <div className="flex flex-1 overflow-hidden">
        {/* Side Panel */}
        {showSidePanel && (
          <div 
            className={`flex flex-col border-l-2 border-primary/20 transition-all shrink-0 ${
              nightMode ? "bg-slate-800" : "bg-card"
            } ${
              sidePanelWidth === "narrow" ? "w-64" : sidePanelWidth === "wide" ? "w-[28rem]" : "w-80"
            }`}
          >
            {/* Panel Header with controls */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-border bg-muted/30">
              <div className="flex gap-0.5">
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
                { id: "annotations", icon: MessageSquare, label: "הדגשות" },
                { id: "progress", icon: BookMarked, label: "מעקב" },
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
                {/* Annotations Panel */}
                {sidePanel === "annotations" && (
                  <div className="space-y-4">
                    {/* Add new annotation */}
                    <Card className="p-3 border-2 border-dashed border-primary/30">
                      <p className="text-sm font-medium flex items-center gap-2 mb-3">
                        <Plus className="w-4 h-4 text-primary" />
                        הוסף הערה ידנית
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

                    {/* Tip for highlighting */}
                    <Card className="p-3 bg-primary/5 border-primary/20">
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Highlighter className="w-4 h-4 text-primary" />
                        סמן טקסט ב-PDF ובחר צבע להדגשה אוטומטית
                      </p>
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
                              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-muted"
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
                                        <Button
                                          size="sm"
                                          onClick={() => handleUpdateAnnotation(annotation.id)}
                                          disabled={updateAnnotation.isPending}
                                        >
                                          <Check className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setEditingAnnotation(null);
                                            setEditText("");
                                          }}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-sm flex-1">{annotation.note_text}</p>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => {
                                            setEditingAnnotation(annotation.id);
                                            setEditText(annotation.note_text);
                                          }}
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-destructive"
                                          onClick={() => handleDeleteAnnotation(annotation.id)}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
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

                {/* Reading Progress Panel */}
                {sidePanel === "progress" && (
                  <div className="space-y-4">
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
                  </div>
                )}

                {/* Settings Panel */}
                {sidePanel === "settings" && (
                  <div className="space-y-6">
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

                    <Card className="p-4 bg-primary/5 border-primary/20">
                      <p className="text-sm font-medium flex items-center gap-2 mb-2">
                        <Highlighter className="w-4 h-4 text-primary" />
                        טיפ להדגשה
                      </p>
                      <p className="text-xs text-muted-foreground">
                        סמנו טקסט על ה-PDF ותופיע אפשרות להדגשה ושמירה אוטומטית.
                        <br />
                        החזק Alt ובחר אזור להדגשת תמונות.
                      </p>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* PDF Viewer with react-pdf-highlighter-extended */}
        <div 
          ref={containerRef} 
          className={`flex-1 flex flex-col overflow-hidden transition-colors ${
            nightMode 
              ? "bg-gradient-to-b from-slate-800 to-slate-900" 
              : "bg-gradient-to-b from-muted/20 to-muted/40"
          }`}
        >
          <PDFHighlighterComponent
            fileUrl={fileUrl}
            highlights={libraryHighlights}
            onAddHighlight={handleAddLibraryHighlight}
            onDeleteHighlight={handleDeleteLibraryHighlight}
            onUpdateHighlight={handleUpdateLibraryHighlight}
            nightMode={nightMode}
            zoom={zoom}
            className="flex-1"
          />
        </div>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] w-full h-full p-2" dir="rtl">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" />
              {fileName}
              {annotations.length > 0 && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Highlighter className="w-3 h-3" />
                  {annotations.length}
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="mr-auto h-7 w-7" onClick={() => setShowFullscreen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className={`flex-1 overflow-hidden rounded-lg ${nightMode ? "bg-slate-900" : "bg-muted/30"}`}>
            <PDFHighlighterComponent
              fileUrl={fileUrl}
              highlights={libraryHighlights}
              onAddHighlight={handleAddLibraryHighlight}
              onDeleteHighlight={handleDeleteLibraryHighlight}
              onUpdateHighlight={handleUpdateLibraryHighlight}
              nightMode={nightMode}
              zoom={100}
              className="h-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
