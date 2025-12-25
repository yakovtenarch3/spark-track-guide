import { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjs from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Search,
  Download,
  Printer,
  RotateCw,
  Highlighter,
  Loader2,
  FileText,
  Grid,
  List,
} from "lucide-react";
import { toast } from "sonner";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface Highlight {
  id: string;
  pageNumber: number;
  text: string;
  color: string;
  rects: { x: number; y: number; width: number; height: number }[];
}

interface MozillaPDFViewerProps {
  fileUrl: string;
  onHighlightAdd?: (highlight: Highlight) => void;
  onHighlightRemove?: (id: string) => void;
  initialHighlights?: Highlight[];
}

export const MozillaPDFViewer = ({
  fileUrl,
  onHighlightAdd,
  onHighlightRemove,
  initialHighlights = [],
}: MozillaPDFViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<"single" | "continuous">("continuous");
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlightColor, setHighlightColor] = useState("#FFEB3B");
  const [highlights, setHighlights] = useState<Highlight[]>(initialHighlights);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const pagesContainerRef = useRef<HTMLDivElement>(null);

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      setLoading(true);
      try {
        const loadingTask = pdfjs.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        toast.success(`PDF נטען בהצלחה - ${pdf.numPages} עמודים`);
      } catch (error) {
        console.error("Error loading PDF:", error);
        toast.error("שגיאה בטעינת ה-PDF");
      } finally {
        setLoading(false);
      }
    };

    if (fileUrl) {
      loadPDF();
    }
  }, [fileUrl]);

  // Render a single page
  const renderPage = useCallback(
    async (pageNum: number, container: HTMLDivElement) => {
      if (!pdfDoc || renderedPages.has(pageNum)) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale, rotation });

        // Create page wrapper
        const pageWrapper = document.createElement("div");
        pageWrapper.className = "pdf-page-wrapper relative mb-4 shadow-lg bg-white";
        pageWrapper.style.width = `${viewport.width}px`;
        pageWrapper.style.height = `${viewport.height}px`;
        pageWrapper.dataset.pageNumber = pageNum.toString();

        // Canvas for PDF rendering
        const canvas = document.createElement("canvas");
        canvas.className = "pdf-canvas";
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext("2d");
        if (!context) return;

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Text layer for selection
        const textLayerDiv = document.createElement("div");
        textLayerDiv.className = "textLayer absolute top-0 left-0";
        textLayerDiv.style.width = `${viewport.width}px`;
        textLayerDiv.style.height = `${viewport.height}px`;

        const textContent = await page.getTextContent();
        
        // Render text layer using PDF.js
        const textItems = textContent.items as any[];
        textItems.forEach((item) => {
          const tx = pdfjs.Util.transform(viewport.transform, item.transform);
          const span = document.createElement("span");
          span.textContent = item.str;
          span.style.position = "absolute";
          span.style.left = `${tx[4]}px`;
          span.style.top = `${tx[5] - item.height}px`;
          span.style.fontSize = `${Math.abs(tx[0])}px`;
          span.style.fontFamily = item.fontName || "sans-serif";
          span.style.color = "transparent";
          span.style.whiteSpace = "pre";
          span.style.transformOrigin = "0% 0%";
          // Handle RTL text
          if (item.dir === "rtl") {
            span.style.direction = "rtl";
            span.style.unicodeBidi = "bidi-override";
          }
          textLayerDiv.appendChild(span);
        });

        // Highlight layer
        const highlightLayer = document.createElement("div");
        highlightLayer.className = "highlight-layer absolute top-0 left-0 pointer-events-none";
        highlightLayer.style.width = `${viewport.width}px`;
        highlightLayer.style.height = `${viewport.height}px`;

        // Add existing highlights for this page
        highlights
          .filter((h) => h.pageNumber === pageNum)
          .forEach((highlight) => {
            highlight.rects.forEach((rect) => {
              const highlightDiv = document.createElement("div");
              highlightDiv.className = "highlight-rect absolute";
              highlightDiv.style.left = `${rect.x * scale}px`;
              highlightDiv.style.top = `${rect.y * scale}px`;
              highlightDiv.style.width = `${rect.width * scale}px`;
              highlightDiv.style.height = `${rect.height * scale}px`;
              highlightDiv.style.backgroundColor = highlight.color;
              highlightDiv.style.opacity = "0.4";
              highlightDiv.style.mixBlendMode = "multiply";
              highlightLayer.appendChild(highlightDiv);
            });
          });

        pageWrapper.appendChild(canvas);
        pageWrapper.appendChild(textLayerDiv);
        pageWrapper.appendChild(highlightLayer);

        // Add page number indicator
        const pageIndicator = document.createElement("div");
        pageIndicator.className = "absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded";
        pageIndicator.textContent = `עמוד ${pageNum}`;
        pageWrapper.appendChild(pageIndicator);

        container.appendChild(pageWrapper);
        setRenderedPages((prev) => new Set(prev).add(pageNum));
      } catch (error) {
        console.error(`Error rendering page ${pageNum}:`, error);
      }
    },
    [pdfDoc, scale, rotation, highlights, renderedPages]
  );

  // Render all pages in continuous mode
  useEffect(() => {
    if (!pdfDoc || !pagesContainerRef.current) return;

    const container = pagesContainerRef.current;
    container.innerHTML = "";
    setRenderedPages(new Set());

    if (viewMode === "continuous") {
      // Render all pages
      for (let i = 1; i <= totalPages; i++) {
        renderPage(i, container);
      }
    } else {
      // Render only current page
      renderPage(currentPage, container);
    }
  }, [pdfDoc, viewMode, currentPage, scale, rotation, renderPage, totalPages]);

  // Handle text selection for highlighting
  useEffect(() => {
    const handleMouseUp = () => {
      if (!highlightMode) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      // Get selection range and rects
      const range = selection.getRangeAt(0);
      const rects = Array.from(range.getClientRects());

      if (rects.length === 0) return;

      // Find which page the selection is on
      const pageWrapper = range.startContainer.parentElement?.closest(".pdf-page-wrapper");
      const pageNumber = pageWrapper?.dataset.pageNumber
        ? parseInt(pageWrapper.dataset.pageNumber)
        : currentPage;

      // Convert rects to page coordinates
      const pageRect = pageWrapper?.getBoundingClientRect();
      if (!pageRect) return;

      const highlightRects = rects.map((rect) => ({
        x: (rect.left - pageRect.left) / scale,
        y: (rect.top - pageRect.top) / scale,
        width: rect.width / scale,
        height: rect.height / scale,
      }));

      const newHighlight: Highlight = {
        id: `highlight-${Date.now()}`,
        pageNumber,
        text: selectedText,
        color: highlightColor,
        rects: highlightRects,
      };

      setHighlights((prev) => [...prev, newHighlight]);
      onHighlightAdd?.(newHighlight);
      toast.success("הטקסט הודגש!");

      selection.removeAllRanges();
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [highlightMode, highlightColor, currentPage, scale, onHighlightAdd]);

  // Navigate to page
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);

    if (viewMode === "continuous" && pagesContainerRef.current) {
      const pageElement = pagesContainerRef.current.querySelector(
        `[data-page-number="${page}"]`
      );
      pageElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Zoom functions
  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));

  // Rotate
  const rotate = () => setRotation((r) => (r + 90) % 360);

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Download
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = "document.pdf";
    link.click();
  };

  const HIGHLIGHT_COLORS = [
    { value: "#FFEB3B", label: "צהוב" },
    { value: "#81C784", label: "ירוק" },
    { value: "#64B5F6", label: "כחול" },
    { value: "#FF8A65", label: "כתום" },
    { value: "#CE93D8", label: "סגול" },
    { value: "#F48FB1", label: "ורוד" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-lg">טוען PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/30" dir="rtl">
      {/* Toolbar */}
      <Card className="p-3 m-2 space-y-2">
        {/* Top row - Navigation and Zoom */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-16 text-center"
                min={1}
                max={totalPages}
              />
              <span className="text-sm text-muted-foreground">/ {totalPages}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={zoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
            <Button size="sm" variant="outline" onClick={zoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={viewMode === "single" ? "default" : "outline"}
              onClick={() => setViewMode("single")}
            >
              <FileText className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "continuous" ? "default" : "outline"}
              onClick={() => setViewMode("continuous")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={rotate}>
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bottom row - Highlight tools */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={highlightMode ? "default" : "outline"}
              onClick={() => setHighlightMode(!highlightMode)}
              className="gap-1"
            >
              <Highlighter className="w-4 h-4" />
              {highlightMode ? "מצב הדגשה פעיל" : "הפעל הדגשה"}
            </Button>

            {highlightMode && (
              <div className="flex items-center gap-1">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setHighlightColor(color.value)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      highlightColor === color.value
                        ? "border-foreground ring-2 ring-primary"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="חיפוש בטקסט..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-48"
            />
            <Button size="sm" variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {highlightMode && (
          <div className="text-xs text-center text-muted-foreground bg-primary/10 py-1 rounded">
            💡 סמן טקסט עם העכבר כדי להדגיש אותו
          </div>
        )}
      </Card>

      {/* PDF Content */}
      <ScrollArea className="flex-1">
        <div
          ref={pagesContainerRef}
          className="flex flex-col items-center p-4 min-h-full"
          style={{ direction: "ltr" }}
        />
      </ScrollArea>

      {/* Highlights sidebar */}
      {highlights.length > 0 && (
        <Card className="m-2 p-3 max-h-48 overflow-auto">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Highlighter className="w-4 h-4" />
            הדגשות ({highlights.length})
          </h3>
          <div className="space-y-2">
            {highlights.map((h) => (
              <div
                key={h.id}
                className="text-xs p-2 rounded border flex items-start justify-between gap-2"
                style={{ borderRightColor: h.color, borderRightWidth: "4px" }}
              >
                <div>
                  <span className="text-muted-foreground">עמוד {h.pageNumber}: </span>
                  <span className="line-clamp-2">{h.text}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setHighlights((prev) => prev.filter((x) => x.id !== h.id));
                    onHighlightRemove?.(h.id);
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* CSS for text layer */}
      <style>{`
        .textLayer {
          opacity: 1;
          line-height: 1.0;
          pointer-events: auto;
        }
        .textLayer span {
          cursor: text;
          user-select: text;
        }
        .textLayer span::selection {
          background: ${highlightColor}80;
        }
        .pdf-page-wrapper {
          position: relative;
          margin: 0 auto;
        }
        @media print {
          .pdf-page-wrapper {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
};

export default MozillaPDFViewer;
