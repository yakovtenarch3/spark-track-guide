import { useState, useRef, useCallback, useEffect } from "react";
import * as pdfjs from "pdfjs-dist";
import {
  PdfLoader,
  PdfHighlighter,
  TextHighlight,
  AreaHighlight,
  useHighlightContainerContext,
  usePdfHighlighterContext,
} from "react-pdf-highlighter-extended";
import type { 
  Highlight, 
  Content, 
  ScaledPosition, 
  PdfHighlighterUtils,
  GhostHighlight,
  Scaled,
} from "react-pdf-highlighter-extended";

// Configure PDF.js worker to match the library version (4.4.168)
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
import "react-pdf-highlighter-extended/dist/esm/style/AreaHighlight.css";
import "react-pdf-highlighter-extended/dist/esm/style/MouseSelection.css";
import "react-pdf-highlighter-extended/dist/esm/style/PdfHighlighter.css";
import "react-pdf-highlighter-extended/dist/esm/style/TextHighlight.css";
import "react-pdf-highlighter-extended/dist/esm/style/pdf_viewer.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, MessageSquare } from "lucide-react";
import { toast } from "sonner";

// Custom highlight type with color and note
export interface CustomHighlight extends Highlight {
  color: string;
  noteText: string;
  highlightText?: string;
}

const HIGHLIGHT_COLORS = [
  { value: "#FFEB3B", label: "צהוב", className: "bg-yellow-400" },
  { value: "#81C784", label: "ירוק", className: "bg-green-400" },
  { value: "#64B5F6", label: "כחול", className: "bg-blue-400" },
  { value: "#FF8A65", label: "כתום", className: "bg-orange-400" },
  { value: "#CE93D8", label: "סגול", className: "bg-purple-400" },
  { value: "#F48FB1", label: "ורוד", className: "bg-pink-400" },
];

// Selection Tip Component - appears when text is selected
interface SelectionTipProps {
  onSaveHighlight: (color: string, note?: string) => void;
  onCancel: () => void;
}

const SelectionTip = ({ onSaveHighlight, onCancel }: SelectionTipProps) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState("");
  const { getCurrentSelection } = usePdfHighlighterContext();

  const handleColorClick = (color: string) => {
    if (showNoteInput) {
      onSaveHighlight(color, note);
    } else {
      onSaveHighlight(color);
    }
  };

  return (
    <Card className="p-3 shadow-xl border-2 border-primary/30 bg-card z-50 min-w-[200px]" dir="rtl">
      <div className="space-y-3">
        {/* Color selection */}
        <div className="flex items-center gap-2 justify-center">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorClick(color.value)}
              className="w-8 h-8 rounded-full border-2 border-transparent hover:scale-110 hover:border-foreground transition-all shadow-md"
              style={{ backgroundColor: color.value }}
              title={`הדגש ב${color.label}`}
            />
          ))}
        </div>

        {/* Note toggle */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={showNoteInput ? "default" : "outline"}
            className="flex-1 gap-1 text-xs"
            onClick={() => {
              setShowNoteInput(!showNoteInput);
              // Make ghost highlight to keep selection visible
              getCurrentSelection()?.makeGhostHighlight();
            }}
          >
            <MessageSquare className="w-3 h-3" />
            {showNoteInput ? "בטל הערה" : "הוסף הערה"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="px-2">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Note input */}
        {showNoteInput && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="הוסף הערה להדגשה..."
            className="w-full p-2 text-sm border rounded-lg resize-none"
            rows={2}
            autoFocus
          />
        )}
      </div>
    </Card>
  );
};

// Highlight Container Component
interface HighlightContainerProps {
  onDelete: (id: string) => void;
  onUpdateColor: (id: string, color: string) => void;
}

const HighlightContainer = ({ onDelete, onUpdateColor }: HighlightContainerProps) => {
  const {
    highlight,
    isScrolledTo,
    highlightBindings,
  } = useHighlightContainerContext<CustomHighlight>();

  const [showMenu, setShowMenu] = useState(false);
  const { toggleEditInProgress } = usePdfHighlighterContext();

  const isTextHighlight = !(highlight.content && highlight.content.image);
  const highlightColor = highlight.color || "#FFEB3B";

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(true);
  };

  const handleDelete = () => {
    if (window.confirm("למחוק את ההדגשה?")) {
      onDelete(highlight.id);
    }
    setShowMenu(false);
  };

  const handleChangeColor = (color: string) => {
    onUpdateColor(highlight.id, color);
    setShowMenu(false);
  };

  const component = isTextHighlight ? (
    <TextHighlight
      isScrolledTo={isScrolledTo}
      highlight={highlight}
      style={{
        background: `${highlightColor}70`,
        mixBlendMode: "multiply",
      }}
      onContextMenu={handleContextMenu}
    />
  ) : (
    <AreaHighlight
      isScrolledTo={isScrolledTo}
      highlight={highlight}
      style={{
        background: `${highlightColor}50`,
        border: `2px solid ${highlightColor}`,
      }}
      bounds={highlightBindings?.textLayer}
      onContextMenu={handleContextMenu}
      onChange={() => {
        toggleEditInProgress(false);
      }}
      onEditStart={() => toggleEditInProgress(true)}
    />
  );

  return (
    <div className="relative group">
      {component}
      
      {/* Context Menu */}
      {showMenu && (
        <div 
          className="absolute top-full left-0 z-50 mt-1 p-2 bg-card border rounded-lg shadow-xl"
          onMouseLeave={() => setShowMenu(false)}
        >
          <div className="flex gap-1 mb-2">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleChangeColor(color.value)}
                className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                  highlightColor === color.value ? "border-foreground ring-2 ring-primary" : "border-transparent"
                }`}
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
          <Button size="sm" variant="destructive" onClick={handleDelete} className="w-full text-xs gap-1">
            <X className="w-3 h-3" />
            מחק
          </Button>
        </div>
      )}

      {/* Show note tooltip on hover */}
      {highlight.noteText && highlight.noteText.length > 0 && !highlight.noteText.startsWith("הדגשה:") && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <Badge className="text-xs whitespace-nowrap max-w-[200px] truncate" style={{ backgroundColor: highlightColor }}>
            {highlight.noteText}
          </Badge>
        </div>
      )}
    </div>
  );
};

// Main PDF Highlighter Component
interface PDFHighlighterComponentProps {
  fileUrl: string;
  highlights: CustomHighlight[];
  onAddHighlight: (highlight: CustomHighlight) => void;
  onDeleteHighlight: (id: string) => void;
  onUpdateHighlight: (id: string, updates: Partial<CustomHighlight>) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  nightMode?: boolean;
  zoom?: number;
  className?: string;
}

export const PDFHighlighterComponent = ({
  fileUrl,
  highlights,
  onAddHighlight,
  onDeleteHighlight,
  onUpdateHighlight,
  currentPage = 1,
  onPageChange,
  nightMode = false,
  zoom = 100,
  className = "",
}: PDFHighlighterComponentProps) => {
  const highlighterUtilsRef = useRef<PdfHighlighterUtils | null>(null);

  // Scroll to page when currentPage changes
  useEffect(() => {
    if (highlighterUtilsRef.current && currentPage) {
      // The library handles scrolling automatically via page changes
    }
  }, [currentPage]);

  const handleAddHighlight = useCallback(
    (color: string, note?: string) => {
      const selection = highlighterUtilsRef.current?.getCurrentSelection();
      if (!selection) {
        toast.error("בחר טקסט להדגשה");
        return;
      }

      const ghostHighlight = selection.makeGhostHighlight();
      if (!ghostHighlight) return;

      const newHighlight: CustomHighlight = {
        id: `highlight-${Date.now()}`,
        type: ghostHighlight.type,
        position: ghostHighlight.position,
        content: ghostHighlight.content,
        color: color,
        noteText: note || `הדגשה: ${ghostHighlight.content.text || ""}`,
        highlightText: ghostHighlight.content.text,
      };

      onAddHighlight(newHighlight);
      highlighterUtilsRef.current?.removeGhostHighlight();
      highlighterUtilsRef.current?.setTip(null);
      toast.success("ההדגשה נשמרה!");
    },
    [onAddHighlight]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onDeleteHighlight(id);
      toast.success("ההדגשה נמחקה");
    },
    [onDeleteHighlight]
  );

  const handleUpdateColor = useCallback(
    (id: string, color: string) => {
      onUpdateHighlight(id, { color });
      toast.success("הצבע עודכן");
    },
    [onUpdateHighlight]
  );

  const selectionTip = (
    <SelectionTip
      onSaveHighlight={handleAddHighlight}
      onCancel={() => {
        highlighterUtilsRef.current?.removeGhostHighlight();
        highlighterUtilsRef.current?.setTip(null);
      }}
    />
  );

  return (
    <div 
      className={`w-full h-full relative ${nightMode ? "pdf-night-mode" : ""} ${className}`}
      style={{ 
        transform: `scale(${zoom / 100})`,
        transformOrigin: "top center",
      }}
    >
      <PdfLoader
        document={fileUrl}
        beforeLoad={(progressData) => (
          <div className="flex items-center justify-center h-full gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span>טוען PDF... {progressData.loaded ? Math.round((progressData.loaded / (progressData.total || 1)) * 100) : 0}%</span>
          </div>
        )}
        errorMessage={(error) => (
          <div className="text-destructive text-center p-4">
            <p>שגיאה בטעינת הקובץ</p>
            <p className="text-xs text-muted-foreground">{error.message}</p>
          </div>
        )}
      >
        {(pdfDocument) => (
          <PdfHighlighter
            pdfDocument={pdfDocument}
            highlights={highlights}
            enableAreaSelection={(event) => event.altKey}
            utilsRef={(utils) => {
              highlighterUtilsRef.current = utils;
            }}
            selectionTip={selectionTip}
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            <HighlightContainer
              onDelete={handleDelete}
              onUpdateColor={handleUpdateColor}
            />
          </PdfHighlighter>
        )}
      </PdfLoader>

      {/* Night mode overlay */}
      {nightMode && (
        <style>{`
          .pdf-night-mode .react-pdf__Page {
            filter: invert(0.85) hue-rotate(180deg);
          }
        `}</style>
      )}
    </div>
  );
};

// Helper to convert database annotations to library highlights
export const convertAnnotationToHighlight = (annotation: {
  id: string;
  page_number: number;
  note_text: string;
  highlight_text?: string | null;
  highlight_rects?: any[] | null;
  color: string;
  position_x?: number | null;
  position_y?: number | null;
}): CustomHighlight | null => {
  // If we don't have position data, we can't render the highlight accurately
  if (!annotation.highlight_rects || annotation.highlight_rects.length === 0) {
    return null;
  }

  // Convert our rect format to library format (Scaled type)
  const rects: Scaled[] = annotation.highlight_rects.map((rect: any) => ({
    x1: rect.x,
    y1: rect.y,
    x2: rect.x + rect.width,
    y2: rect.y + rect.height,
    width: rect.width,
    height: rect.height,
    pageNumber: annotation.page_number,
  }));

  // Calculate bounding rect from all rects
  const boundingRect: Scaled = {
    x1: Math.min(...rects.map(r => r.x1)),
    y1: Math.min(...rects.map(r => r.y1)),
    x2: Math.max(...rects.map(r => r.x2)),
    y2: Math.max(...rects.map(r => r.y2)),
    width: Math.max(...rects.map(r => r.x2)) - Math.min(...rects.map(r => r.x1)),
    height: Math.max(...rects.map(r => r.y2)) - Math.min(...rects.map(r => r.y1)),
    pageNumber: annotation.page_number,
  };

  return {
    id: annotation.id,
    type: "text",
    position: {
      boundingRect,
      rects,
    },
    content: {
      text: annotation.highlight_text || "",
    },
    color: annotation.color || "#FFEB3B",
    noteText: annotation.note_text,
    highlightText: annotation.highlight_text || undefined,
  };
};

// Helper to convert library highlight to database format
export const convertHighlightToAnnotation = (
  highlight: CustomHighlight,
  bookId: string
): {
  bookId: string;
  pageNumber: number;
  noteText: string;
  highlightText?: string;
  color: string;
  highlightRects: any[];
} => {
  // Get pageNumber from the bounding rect
  const pageNumber = highlight.position.boundingRect.pageNumber || 1;
  
  const rects = highlight.position.rects.map((rect) => ({
    x: rect.x1,
    y: rect.y1,
    width: rect.width,
    height: rect.height,
  }));

  return {
    bookId,
    pageNumber,
    noteText: highlight.noteText,
    highlightText: highlight.content?.text || highlight.highlightText,
    color: highlight.color,
    highlightRects: rects,
  };
};

export { HIGHLIGHT_COLORS };
