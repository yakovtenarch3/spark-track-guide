import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  StickyNote
} from "lucide-react";
import { usePDFAnnotations, type PDFAnnotation } from "@/hooks/usePDFAnnotations";
import { toast } from "sonner";

interface PDFViewerProps {
  bookId: string;
  fileUrl: string;
  fileName: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onDelete: () => void;
}

const HIGHLIGHT_COLORS = [
  { value: '#FFEB3B', label: 'צהוב' },
  { value: '#81C784', label: 'ירוק' },
  { value: '#64B5F6', label: 'כחול' },
  { value: '#FF8A65', label: 'כתום' },
  { value: '#CE93D8', label: 'סגול' },
];

export const PDFViewer = ({ 
  bookId,
  fileUrl, 
  fileName, 
  currentPage, 
  onPageChange,
  onDelete 
}: PDFViewerProps) => {
  const [zoom, setZoom] = useState(100);
  const [showAnnotationPanel, setShowAnnotationPanel] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [newHighlight, setNewHighlight] = useState("");
  const [selectedColor, setSelectedColor] = useState('#FFEB3B');
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const { 
    annotations,
    addAnnotation, 
    updateAnnotation,
    deleteAnnotation,
    getPageAnnotations,
    annotationCountsByPage 
  } = usePDFAnnotations(bookId);

  const pageAnnotations = getPageAnnotations(currentPage);

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

  // For PDF.js or iframe display
  const pdfUrlWithPage = `${fileUrl}#page=${currentPage}`;

  return (
    <div className="flex gap-4" dir="rtl">
      {/* Main PDF Viewer */}
      <Card className="flex-1 p-4 royal-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate max-w-[200px]">{fileName}</h3>
            <Badge variant="outline">עמוד {currentPage}</Badge>
            {annotationCountsByPage[currentPage] > 0 && (
              <Badge variant="secondary" className="gap-1">
                <MessageSquare className="w-3 h-3" />
                {annotationCountsByPage[currentPage]}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant={showAnnotationPanel ? "default" : "outline"} 
              size="icon" 
              onClick={() => setShowAnnotationPanel(!showAnnotationPanel)}
              title="הערות"
            >
              <StickyNote className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div 
          className="bg-muted/50 rounded-lg overflow-hidden"
          style={{ height: '55vh' }}
        >
          <iframe
            src={pdfUrlWithPage}
            className="w-full h-full border-0"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            title={fileName}
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="gap-2"
          >
            <ChevronRight className="w-4 h-4" />
            הקודם
          </Button>
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page > 0) onPageChange(page);
              }}
              className="w-16 text-center p-1 border rounded bg-background"
              min={1}
              dir="ltr"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => onPageChange(currentPage + 1)}
            className="gap-2"
          >
            הבא
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Annotations Panel */}
      {showAnnotationPanel && (
        <Card className="w-80 p-4 royal-card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-primary" />
              הערות לעמוד {currentPage}
            </h3>
            <Button variant="ghost" size="icon" onClick={() => setShowAnnotationPanel(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Add New Annotation */}
          <div className="space-y-3 pb-4 border-b mb-4">
            <Textarea
              value={newHighlight}
              onChange={(e) => setNewHighlight(e.target.value)}
              placeholder="טקסט מסומן (אופציונלי)..."
              rows={2}
              className="text-right"
              dir="rtl"
            />
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="כתוב הערה..."
              rows={3}
              className="text-right"
              dir="rtl"
            />
            
            {/* Color Picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">צבע:</span>
              <div className="flex gap-1">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      selectedColor === color.value 
                        ? 'border-foreground scale-110' 
                        : 'border-transparent'
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
              disabled={!newNote.trim() || addAnnotation.isPending}
            >
              <Plus className="w-4 h-4" />
              הוסף הערה
            </Button>
          </div>

          {/* Page Annotations List */}
          <ScrollArea className="flex-1">
            {pageAnnotations.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">
                אין הערות לעמוד זה
              </p>
            ) : (
              <div className="space-y-3">
                {pageAnnotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="p-3 rounded-lg border"
                    style={{ borderRightWidth: 4, borderRightColor: annotation.color }}
                  >
                    {/* Highlighted text */}
                    {annotation.highlight_text && (
                      <div 
                        className="text-xs p-2 rounded mb-2" 
                        style={{ backgroundColor: `${annotation.color}40` }}
                      >
                        "{annotation.highlight_text}"
                      </div>
                    )}
                    
                    {/* Note content */}
                    {editingAnnotation === annotation.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={2}
                          className="text-right"
                          dir="rtl"
                        />
                        <div className="flex gap-1 justify-end">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingAnnotation(null);
                              setEditText("");
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => handleUpdateAnnotation(annotation.id)}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm">{annotation.note_text}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(annotation.created_at).toLocaleDateString('he-IL')}
                          </span>
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
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteAnnotation(annotation.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* All Annotations Summary */}
          {annotations.length > 0 && (
            <div className="pt-3 border-t mt-3">
              <p className="text-xs text-muted-foreground text-center">
                סה"כ {annotations.length} הערות ב-{Object.keys(annotationCountsByPage).length} עמודים
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
