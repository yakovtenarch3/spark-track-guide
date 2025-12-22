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
  Minimize2,
  Type,
  Highlighter,
  BookOpen,
  ChevronDown,
  Palette,
  Loader2,
  Search,
  X,
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
  const [pageWidth, setPageWidth] = useState<number>(800);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // View states
  const [zoom, setZoom] = useState(100);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [sidePanel, setSidePanel] = useState<"index" | "annotations" | "settings">("index");
  const [searchQuery, setSearchQuery] = useState("");

  // Typography states
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("system-ui");

  // Annotation states
  const [newNote, setNewNote] = useState("");
  const [newHighlight, setNewHighlight] = useState("");
  const [selectedColor, setSelectedColor] = useState("#FFEB3B");
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([currentPage]));

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    annotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    getPageAnnotations,
    annotationCountsByPage,
  } = usePDFAnnotations(bookId);

  // Resize handler
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth - 48;
        setPageWidth(Math.min(width, 900));
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [showSidePanel]);

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

  // Generate page index
  const allPages = Array.from({ length: numPages }, (_, i) => i + 1);
  const filteredPages = searchQuery
    ? allPages.filter(
        (p) =>
          p.toString().includes(searchQuery) ||
          (annotationCountsByPage[p] > 0 && `עמוד ${p}`.includes(searchQuery))
      )
    : allPages.filter((p) => p % 5 === 0 || p === 1 || annotationCountsByPage[p] > 0);

  const scaledWidth = (pageWidth * zoom) / 100;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] min-h-[600px] bg-background rounded-xl overflow-hidden border-2 border-border shadow-xl" dir="rtl">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 bg-card border-b-2 border-primary/20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 hover:bg-primary/10">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">חזרה לספרייה</span>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold truncate max-w-[200px]">{fileName}</h3>
              <p className="text-xs text-muted-foreground">
                עמוד {currentPage} מתוך {numPages}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant={showSidePanel ? "default" : "ghost"}
            size="icon"
            onClick={() => setShowSidePanel(!showSidePanel)}
            title="פאנל צדדי"
          >
            <List className="w-4 h-4" />
          </Button>

          <div className="hidden sm:flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 200}>
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
          <div className="w-72 lg:w-80 border-l-2 border-primary/20 bg-card flex flex-col">
            {/* Panel Tabs */}
            <div className="flex border-b border-border">
              {[
                { id: "index", icon: List, label: "עמודים" },
                { id: "annotations", icon: MessageSquare, label: "הערות" },
                { id: "settings", icon: Type, label: "תצוגה" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSidePanel(tab.id as typeof sidePanel)}
                  className={`flex-1 px-2 py-3 text-xs font-medium transition-all flex flex-col items-center gap-1 ${
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
                {/* Page Index */}
                {sidePanel === "index" && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="חפש עמוד..."
                        className="pr-9 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      {filteredPages.map((page) => {
                        const hasAnnotations = annotationCountsByPage[page] > 0;
                        const isActive = page === currentPage;

                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                              isActive
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "hover:bg-muted"
                            }`}
                          >
                            <span className="font-medium">עמוד {page}</span>
                            {hasAnnotations && (
                              <Badge variant={isActive ? "outline" : "secondary"} className="text-xs gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {annotationCountsByPage[page]}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
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
                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Type className="w-4 h-4" />
                        גודל טקסט
                      </label>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-6">12</span>
                        <Slider
                          value={[fontSize]}
                          onValueChange={([val]) => setFontSize(val)}
                          min={12}
                          max={28}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-6">28</span>
                      </div>
                      <div className="text-center">
                        <Badge variant="outline">{fontSize}px</Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        סוג גופן
                      </label>
                      <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map((font) => (
                            <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          step={25}
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

                    {/* Preview */}
                    <Card className="p-4 bg-muted/30" style={{ fontFamily, fontSize: `${fontSize}px` }}>
                      <p>תצוגה מקדימה של הגופן והגודל הנבחרים.</p>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* PDF Viewer */}
        <div ref={containerRef} className="flex-1 flex flex-col bg-gradient-to-b from-muted/20 to-muted/40 overflow-hidden">
          {/* PDF Content */}
          <div className="flex-1 overflow-auto flex justify-center py-6 px-4">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-muted-foreground">טוען את הספר...</p>
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
              className="shadow-2xl rounded-lg overflow-hidden"
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
              />
            </Document>
          </div>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between p-4 bg-card border-t-2 border-primary/20">
            <Button
              variant="outline"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="gap-2"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">הקודם</span>
            </Button>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-16 text-center text-sm"
                min={1}
                max={numPages}
                dir="ltr"
              />
              <span className="text-sm text-muted-foreground hidden sm:inline">מתוך {numPages}</span>
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
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-4" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {fileName}
              <Button variant="ghost" size="icon" className="mr-auto" onClick={() => setShowFullscreen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 h-[calc(95vh-100px)] overflow-auto flex justify-center py-4 bg-muted/30 rounded-lg">
            <Document file={fileUrl} loading={null}>
              <Page pageNumber={currentPage} width={Math.min(window.innerWidth * 0.85, 1200)} />
            </Document>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
