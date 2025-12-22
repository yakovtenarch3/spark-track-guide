import { useState, useCallback, useEffect, useRef } from "react";
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
  ExternalLink,
  Trash2,
  Plus,
  MessageSquare,
  Edit2,
  X,
  Check,
  StickyNote,
  FileText,
  Download,
  List,
  Maximize2,
  Minimize2,
  Type,
  Settings2,
  Highlighter,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Palette
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface EnhancedPDFReaderProps {
  bookId: string;
  fileUrl: string;
  fileName: string;
  currentPage: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  onDelete: () => void;
  onBack: () => void;
}

const HIGHLIGHT_COLORS = [
  { value: '#FFEB3B', label: 'צהוב', className: 'bg-yellow-400' },
  { value: '#81C784', label: 'ירוק', className: 'bg-green-400' },
  { value: '#64B5F6', label: 'כחול', className: 'bg-blue-400' },
  { value: '#FF8A65', label: 'כתום', className: 'bg-orange-400' },
  { value: '#CE93D8', label: 'סגול', className: 'bg-purple-400' },
  { value: '#F48FB1', label: 'ורוד', className: 'bg-pink-400' },
];

const FONT_OPTIONS = [
  { value: 'system-ui', label: 'מערכת' },
  { value: 'David Libre', label: 'דוד' },
  { value: 'Frank Ruhl Libre', label: 'פרנק רוהל' },
  { value: 'Heebo', label: 'היבו' },
  { value: 'Rubik', label: 'רוביק' },
  { value: 'Assistant', label: 'אסיסטנט' },
];

export const EnhancedPDFReader = ({ 
  bookId,
  fileUrl, 
  fileName, 
  currentPage, 
  totalPages = 100,
  onPageChange,
  onDelete,
  onBack
}: EnhancedPDFReaderProps) => {
  // Core states
  const [zoom, setZoom] = useState(100);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showSideIndex, setShowSideIndex] = useState(true);
  const [sidePanel, setSidePanel] = useState<'index' | 'annotations' | 'settings'>('index');
  
  // Typography states
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('system-ui');
  
  // Annotation states
  const [newNote, setNewNote] = useState("");
  const [newHighlight, setNewHighlight] = useState("");
  const [selectedColor, setSelectedColor] = useState('#FFEB3B');
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([currentPage]));

  const { 
    annotations,
    addAnnotation, 
    updateAnnotation,
    deleteAnnotation,
    getPageAnnotations,
    annotationCountsByPage 
  } = usePDFAnnotations(bookId);

  const pageAnnotations = getPageAnnotations(currentPage);

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
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

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
        color: selectedColor 
      },
      {
        onSuccess: () => {
          toast.success("ההערה נשמרה!");
          setNewNote("");
          setNewHighlight("");
          setExpandedGroups(prev => new Set(prev).add(currentPage));
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
    deleteAnnotation.mutate(
      { annotationId },
      { onSuccess: () => toast.success("ההערה נמחקה") }
    );
  };

  const togglePageGroup = (page: number) => {
    setExpandedGroups(prev => {
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
    onPageChange(page);
    setExpandedGroups(prev => new Set(prev).add(page));
  };

  // Generate page index (every 5 pages + pages with annotations)
  const pageIndex = Array.from({ length: Math.ceil(totalPages / 5) }, (_, i) => (i + 1) * 5)
    .filter(p => p <= totalPages);
  
  // Add pages with annotations that aren't in the regular index
  const allIndexPages = [...new Set([...pageIndex, ...pagesWithAnnotations, 1])].sort((a, b) => a - b);

  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px]" dir="rtl">
      {/* Top Header */}
      <div className="flex items-center justify-between p-3 bg-card border-b border-border rounded-t-xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <BookOpen className="w-4 h-4" />
            חזרה
          </Button>
          <div className="h-6 w-px bg-border" />
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-medium truncate max-w-[200px]">{fileName}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">עמוד {currentPage}</Badge>
          {annotationCountsByPage[currentPage] > 0 && (
            <Badge variant="secondary" className="gap-1">
              <MessageSquare className="w-3 h-3" />
              {annotationCountsByPage[currentPage]}
            </Badge>
          )}
          
          <div className="h-6 w-px bg-border" />
          
          <Button 
            variant={showSideIndex ? "default" : "ghost"} 
            size="icon"
            onClick={() => setShowSideIndex(!showSideIndex)}
            title="אינדקס צדדי"
          >
            <List className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 50}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 200}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowFullscreen(true)}
            title="מסך מלא"
          >
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
        {showSideIndex && (
          <div className="w-80 border-l border-border bg-card flex flex-col">
            {/* Panel Tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setSidePanel('index')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  sidePanel === 'index' 
                    ? 'bg-primary/10 text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <List className="w-4 h-4 inline ml-1" />
                אינדקס
              </button>
              <button
                onClick={() => setSidePanel('annotations')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  sidePanel === 'annotations' 
                    ? 'bg-primary/10 text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <StickyNote className="w-4 h-4 inline ml-1" />
                הערות
                {annotations.length > 0 && (
                  <Badge variant="secondary" className="mr-1 text-xs">
                    {annotations.length}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setSidePanel('settings')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  sidePanel === 'settings' 
                    ? 'bg-primary/10 text-primary border-b-2 border-primary' 
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Type className="w-4 h-4 inline ml-1" />
                תצוגה
              </button>
            </div>

            <ScrollArea className="flex-1 p-3">
              {/* Page Index */}
              {sidePanel === 'index' && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground mb-3">ניווט מהיר בין עמודים</p>
                  {allIndexPages.map((page) => {
                    const hasAnnotations = annotationCountsByPage[page] > 0;
                    const isActive = page === currentPage;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        <span>עמוד {page}</span>
                        {hasAnnotations && (
                          <Badge 
                            variant={isActive ? "outline" : "secondary"} 
                            className="text-xs"
                          >
                            <MessageSquare className="w-3 h-3 ml-1" />
                            {annotationCountsByPage[page]}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* All Annotations View */}
              {sidePanel === 'annotations' && (
                <div className="space-y-4">
                  {/* Add new annotation */}
                  <div className="space-y-3 pb-4 border-b border-border">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      הוסף הערה לעמוד {currentPage}
                    </p>
                    
                    <Textarea
                      value={newHighlight}
                      onChange={(e) => setNewHighlight(e.target.value)}
                      placeholder="טקסט מסומן (אופציונלי)..."
                      rows={2}
                      className="text-right text-sm"
                      dir="rtl"
                    />
                    
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="כתוב הערה..."
                      rows={2}
                      className="text-right text-sm"
                      dir="rtl"
                    />
                    
                    {/* Color Picker */}
                    <div className="flex items-center gap-2">
                      <Highlighter className="w-4 h-4 text-muted-foreground" />
                      <div className="flex gap-1">
                        {HIGHLIGHT_COLORS.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setSelectedColor(color.value)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              selectedColor === color.value 
                                ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-primary' 
                                : 'border-transparent hover:scale-105'
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

                  {/* Grouped annotations */}
                  {pagesWithAnnotations.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      אין הערות עדיין
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {pagesWithAnnotations.map((page) => (
                        <Collapsible 
                          key={page} 
                          open={expandedGroups.has(page)}
                          onOpenChange={() => togglePageGroup(page)}
                        >
                          <CollapsibleTrigger className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                            page === currentPage ? 'bg-primary/10' : 'hover:bg-muted'
                          }`}>
                            <div className="flex items-center gap-2">
                              {expandedGroups.has(page) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronUp className="w-4 h-4" />
                              )}
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
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent className="pr-4 mt-2 space-y-2">
                            {annotationsByPage[page].map((annotation) => (
                              <AnnotationCard
                                key={annotation.id}
                                annotation={annotation}
                                isEditing={editingAnnotation === annotation.id}
                                editText={editText}
                                onEditTextChange={setEditText}
                                onStartEdit={() => {
                                  setEditingAnnotation(annotation.id);
                                  setEditText(annotation.note_text);
                                }}
                                onCancelEdit={() => {
                                  setEditingAnnotation(null);
                                  setEditText("");
                                }}
                                onSaveEdit={() => handleUpdateAnnotation(annotation.id)}
                                onDelete={() => handleDeleteAnnotation(annotation.id)}
                              />
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Typography Settings */}
              {sidePanel === 'settings' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      גודל גופן
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">12</span>
                      <Slider
                        value={[fontSize]}
                        onValueChange={([val]) => setFontSize(val)}
                        min={12}
                        max={28}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground">28</span>
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      {fontSize}px
                    </p>
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
                          <SelectItem 
                            key={font.value} 
                            value={font.value}
                            style={{ fontFamily: font.value }}
                          >
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">זום</label>
                    <div className="flex items-center gap-3">
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
                    <p className="text-center text-sm text-muted-foreground">
                      {zoom}%
                    </p>
                  </div>

                  {/* Preview */}
                  <div 
                    className="p-4 rounded-lg border bg-muted/30"
                    style={{ fontFamily, fontSize: `${fontSize}px` }}
                  >
                    <p>תצוגה מקדימה של הטקסט בגודל ובגופן הנבחרים.</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* PDF Viewer */}
        <div className="flex-1 flex flex-col bg-muted/30">
          <div 
            className="flex-1 overflow-auto p-4"
            style={{ fontFamily, fontSize: `${fontSize}px` }}
          >
            <object
              data={`${fileUrl}#page=${currentPage}&zoom=${zoom}`}
              type="application/pdf"
              className="w-full h-full rounded-lg shadow-lg"
              style={{ 
                transform: `scale(${zoom / 100})`, 
                transformOrigin: 'top center',
                minHeight: '100%'
              }}
            >
              {/* Fallback to Google Docs Viewer */}
              <iframe
                src={googleViewerUrl}
                className="w-full h-full border-0 rounded-lg"
                title={fileName}
              >
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    הדפדפן לא תומך בהצגת PDF ישירה.
                  </p>
                  <div className="flex gap-2">
                    <Button asChild>
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                        פתח בחלון חדש
                      </a>
                    </Button>
                  </div>
                </div>
              </iframe>
            </object>
          </div>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between p-3 bg-card border-t border-border">
            <Button
              variant="outline"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="gap-2"
            >
              <ChevronRight className="w-4 h-4" />
              הקודם
            </Button>
            
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page > 0 && page <= totalPages) onPageChange(page);
                }}
                className="w-16 text-center p-2 border rounded-lg bg-background text-sm"
                min={1}
                max={totalPages}
                dir="ltr"
              />
              <span className="text-sm text-muted-foreground">מתוך {totalPages}</span>
            </div>

            <Button
              variant="outline"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="gap-2"
            >
              הבא
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Fullscreen PDF Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-4" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {fileName}
              <Button
                variant="ghost"
                size="icon"
                className="mr-auto"
                onClick={() => setShowFullscreen(false)}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 h-[calc(95vh-100px)] bg-muted/30 rounded-lg overflow-hidden">
            <object
              data={fileUrl}
              type="application/pdf"
              className="w-full h-full"
            >
              <iframe
                src={googleViewerUrl}
                className="w-full h-full border-0"
                title={fileName}
              />
            </object>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Annotation Card Component
interface AnnotationCardProps {
  annotation: PDFAnnotation;
  isEditing: boolean;
  editText: string;
  onEditTextChange: (text: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}

const AnnotationCard = ({
  annotation,
  isEditing,
  editText,
  onEditTextChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: AnnotationCardProps) => {
  return (
    <div
      className="p-3 rounded-lg border bg-card text-sm"
      style={{ borderRightWidth: 4, borderRightColor: annotation.color }}
    >
      {/* Highlighted text */}
      {annotation.highlight_text && (
        <div 
          className="text-xs p-2 rounded mb-2 italic" 
          style={{ backgroundColor: `${annotation.color}30` }}
        >
          "{annotation.highlight_text}"
        </div>
      )}
      
      {/* Note content */}
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            rows={2}
            className="text-right text-sm"
            dir="rtl"
          />
          <div className="flex gap-1 justify-end">
            <Button 
              size="icon" 
              variant="ghost"
              className="h-7 w-7"
              onClick={onCancelEdit}
            >
              <X className="w-3 h-3" />
            </Button>
            <Button 
              size="icon" 
              className="h-7 w-7"
              onClick={onSaveEdit}
            >
              <Check className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="leading-relaxed">{annotation.note_text}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {new Date(annotation.created_at).toLocaleDateString('he-IL')}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onStartEdit}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                onClick={onDelete}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
