import { useState, useRef, useCallback, useEffect } from "react";
import * as pdfjs from "pdfjs-dist";
import {
  PdfLoader,
  PdfHighlighter,
  TextHighlight,
  AreaHighlight,
  useHighlightContainerContext,
  usePdfHighlighterContext,
  MonitoredHighlightContainer,
  type PdfHighlighterUtils,
  type Highlight,
  type GhostHighlight,
  type PdfScaleValue,
} from "react-pdf-highlighter-extended";
import "react-pdf-highlighter-extended/dist/esm/style/PdfHighlighter.css";
import "react-pdf-highlighter-extended/dist/esm/style/TextHighlight.css";
import "react-pdf-highlighter-extended/dist/esm/style/AreaHighlight.css";
import "react-pdf-highlighter-extended/dist/esm/style/MouseSelection.css";
import "react-pdf-highlighter-extended/dist/esm/style/pdf_viewer.css";

// Set the worker using local pdfjs-dist package to ensure version match
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  BookOpen,
  Trash2,
  MessageSquare,
  FileText,
  Moon,
  Sun,
  Highlighter,
  Loader2,
  Check,
  X,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

// Custom highlight type with comment
export interface PDFHighlight extends Highlight {
  comment?: string;
  color?: string;
}

interface PDFHighlightViewerProps {
  bookId: string;
  fileUrl: string;
  fileName: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onDelete: () => void;
  onBack: () => void;
  highlights: PDFHighlight[];
  onAddHighlight: (highlight: PDFHighlight) => void;
  onUpdateHighlight: (id: string, updates: Partial<PDFHighlight>) => void;
  onDeleteHighlight: (id: string) => void;
}

const HIGHLIGHT_COLORS = [
  { value: "#FFEB3B", label: "צהוב" },
  { value: "#81C784", label: "ירוק" },
  { value: "#64B5F6", label: "כחול" },
  { value: "#FF8A65", label: "כתום" },
  { value: "#CE93D8", label: "סגול" },
  { value: "#F48FB1", label: "ורוד" },
];

// Highlight container component
const HighlightContainer = ({
  onDeleteHighlight,
}: {
  onDeleteHighlight: (id: string) => void;
}) => {
  const { highlight, isScrolledTo, highlightBindings } =
    useHighlightContainerContext<PDFHighlight>();

  const isTextHighlight = highlight.type === "text" || !highlight.content?.image;

  const highlightColor = highlight.color || "#FFEB3B";

  const HighlightPopup = () => (
    <div
      className="bg-popover border border-border rounded-lg shadow-lg p-3 max-w-xs"
      dir="rtl"
    >
      {highlight.comment && (
        <p className="text-sm mb-2" style={{ unicodeBidi: "plaintext" }}>
          {highlight.comment}
        </p>
      )}
      {highlight.content?.text && (
        <p
          className="text-xs text-muted-foreground italic mb-2"
          style={{ unicodeBidi: "plaintext" }}
        >
          "{highlight.content.text.substring(0, 100)}
          {highlight.content.text.length > 100 ? "..." : ""}"
        </p>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDeleteHighlight(highlight.id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );

  const component = isTextHighlight ? (
    <TextHighlight
      isScrolledTo={isScrolledTo}
      highlight={highlight}
      style={{
        background: highlightColor,
        opacity: 0.4,
      }}
    />
  ) : (
    <AreaHighlight
      isScrolledTo={isScrolledTo}
      highlight={highlight}
      style={{
        background: highlightColor,
        opacity: 0.4,
      }}
      bounds={highlightBindings?.textLayer}
    />
  );

  return (
    <MonitoredHighlightContainer
      highlightTip={{
        position: highlight.position,
        content: <HighlightPopup />,
      }}
      key={highlight.id}
    >
      {component}
    </MonitoredHighlightContainer>
  );
};

// Expandable tip for creating new highlights
const ExpandableTip = ({
  onConfirm,
  selectedColor,
  onColorChange,
}: {
  onConfirm: (comment: string) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const { getCurrentSelection, updateTipPosition } = usePdfHighlighterContext();

  const handleExpand = () => {
    setIsExpanded(true);
    const selection = getCurrentSelection();
    if (selection) {
      selection.makeGhostHighlight();
    }
    setTimeout(() => updateTipPosition?.(), 0);
  };

  const handleConfirm = () => {
    onConfirm(comment);
    setComment("");
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-2 flex gap-2">
        <div className="flex gap-1">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => onColorChange(color.value)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                selectedColor === color.value
                  ? "border-foreground scale-110"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
        </div>
        <Button size="sm" onClick={handleExpand} className="gap-1">
          <Plus className="w-3 h-3" />
          הערה
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onConfirm("")}>
          <Check className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="bg-card border border-border rounded-lg shadow-lg p-3 w-64"
      dir="rtl"
    >
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="הוסף הערה..."
        rows={3}
        className="mb-2 text-sm"
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleConfirm}>
          שמור
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setIsExpanded(false);
            setComment("");
          }}
        >
          ביטול
        </Button>
      </div>
    </div>
  );
};

export const PDFHighlightViewer = ({
  bookId,
  fileUrl,
  fileName,
  currentPage,
  onPageChange,
  onDelete,
  onBack,
  highlights,
  onAddHighlight,
  onUpdateHighlight,
  onDeleteHighlight,
}: PDFHighlightViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [zoom, setZoom] = useState<PdfScaleValue>(1);
  const [nightMode, setNightMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#FFEB3B");
  const [showAnnotations, setShowAnnotations] = useState(false);

  const highlighterRef = useRef<PdfHighlighterUtils | null>(null);

  const handleZoomIn = () => {
    if (typeof zoom === "number") {
      setZoom(Math.min(zoom + 0.25, 3));
    } else {
      setZoom(1.25);
    }
  };

  const handleZoomOut = () => {
    if (typeof zoom === "number") {
      setZoom(Math.max(zoom - 0.25, 0.5));
    } else {
      setZoom(0.75);
    }
  };

  const handleAddHighlight = useCallback(
    (ghostHighlight: GhostHighlight, comment: string) => {
      const id = `highlight-${Date.now()}`;
      const newHighlight: PDFHighlight = {
        id,
        type: ghostHighlight.type,
        content: ghostHighlight.content,
        position: ghostHighlight.position,
        comment,
        color: selectedColor,
      };

      onAddHighlight(newHighlight);
      toast.success("ההדגשה נשמרה!");
    },
    [onAddHighlight, selectedColor]
  );

  const pageHighlights = highlights.filter(
    (h) => h.position.boundingRect.pageNumber === currentPage
  );

  return (
    <div
      className={`flex flex-col h-[calc(100vh-100px)] min-h-[600px] rounded-xl overflow-hidden shadow-xl transition-colors ring-2 ring-primary/40 ${
        nightMode ? "bg-slate-900" : "bg-background"
      }`}
      dir="rtl"
    >
      {/* Top Header */}
      <div
        className={`flex items-center justify-between p-3 border-b-2 border-primary/20 ${
          nightMode ? "bg-slate-800" : "bg-card"
        }`}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2 hover:bg-primary/10"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">חזרה</span>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold truncate max-w-[200px] text-sm">
                {fileName}
              </h3>
              <p className="text-xs text-muted-foreground">
                עמוד {currentPage} / {numPages || "..."}
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
            {nightMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="h-7 w-7"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center">
              {typeof zoom === "number" ? `${Math.round(zoom * 100)}%` : zoom}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="h-7 w-7"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Annotations Panel Toggle */}
          <Button
            variant={showAnnotations ? "default" : "ghost"}
            size="icon"
            onClick={() => setShowAnnotations(!showAnnotations)}
            title="הערות"
          >
            <MessageSquare className="w-4 h-4" />
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

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* PDF Viewer */}
        <div
          className={`flex-1 overflow-hidden ${nightMode ? "filter brightness-90 contrast-110" : ""}`}
        >
          <PdfLoader
            document={fileUrl}
            beforeLoad={() => (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
          >
            {(pdfDocument) => {
              if (numPages === 0) {
                setNumPages(pdfDocument.numPages);
              }

              return (
                <PdfHighlighter
                  pdfDocument={pdfDocument}
                  pdfScaleValue={zoom}
                  enableAreaSelection={(event) => event.altKey}
                  highlights={highlights}
                  utilsRef={(utils) => {
                    highlighterRef.current = utils;
                  }}
                  selectionTip={
                    <ExpandableTip
                      onConfirm={(comment) => {
                        const selection =
                          highlighterRef.current?.getCurrentSelection();
                        if (selection) {
                          const ghostHighlight = selection.makeGhostHighlight();
                          handleAddHighlight(ghostHighlight, comment);
                        }
                        highlighterRef.current?.setTip(null);
                      }}
                      selectedColor={selectedColor}
                      onColorChange={setSelectedColor}
                    />
                  }
                  style={{
                    height: "100%",
                    width: "100%",
                  }}
                >
                  <HighlightContainer onDeleteHighlight={onDeleteHighlight} />
                </PdfHighlighter>
              );
            }}
          </PdfLoader>
        </div>

        {/* Annotations Sidebar */}
        {showAnnotations && (
          <div
            className={`w-80 border-l-2 border-primary/20 ${nightMode ? "bg-slate-800" : "bg-card"}`}
          >
            <div className="p-3 border-b border-border">
              <h3 className="font-medium flex items-center gap-2">
                <Highlighter className="w-4 h-4 text-primary" />
                הדגשות והערות
                <Badge variant="secondary">{highlights.length}</Badge>
              </h3>
            </div>
            <ScrollArea className="h-[calc(100%-60px)]">
              <div className="p-3 space-y-2">
                {highlights.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">אין הדגשות עדיין</p>
                    <p className="text-xs">סמן טקסט ב-PDF כדי להוסיף</p>
                  </div>
                ) : (
                  highlights.map((h) => (
                    <Card
                      key={h.id}
                      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      style={{ borderRightColor: h.color, borderRightWidth: 4 }}
                      onClick={() => {
                        highlighterRef.current?.scrollToHighlight(h);
                      }}
                    >
                      {h.content?.text && (
                        <p
                          className="text-xs mb-2 p-2 rounded"
                          style={{
                            backgroundColor: `${h.color}30`,
                            unicodeBidi: "plaintext",
                            direction: "rtl",
                          }}
                        >
                          "{h.content.text.substring(0, 80)}
                          {h.content.text.length > 80 ? "..." : ""}"
                        </p>
                      )}
                      {h.comment && (
                        <p
                          className="text-sm"
                          style={{ unicodeBidi: "plaintext", direction: "rtl" }}
                        >
                          {h.comment}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs">
                          עמוד {h.position.boundingRect.pageNumber}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteHighlight(h.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div
        className={`flex items-center justify-center gap-4 p-3 border-t-2 border-primary/20 ${
          nightMode ? "bg-slate-800" : "bg-card"
        }`}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="gap-1"
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
              if (page >= 1 && page <= numPages) {
                onPageChange(page);
              }
            }}
            className="w-16 text-center bg-muted rounded px-2 py-1 text-sm"
            min={1}
            max={numPages}
          />
          <span className="text-sm text-muted-foreground">/ {numPages}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
          disabled={currentPage >= numPages}
          className="gap-1"
        >
          הבא
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
