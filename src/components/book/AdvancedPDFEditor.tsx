import { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";
import * as pdfjs from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Highlighter, 
  Type, 
  Bold, 
  Italic, 
  Underline, 
  Trash2, 
  Download,
  Palette,
  MousePointer,
  Eraser,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { runHebrewOcrOnCanvas, type OcrPageResult } from "@/utils/hebrewOcr";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface AdvancedPDFEditorProps {
  fileUrl: string;
  onSave?: (data: any) => void;
  initialAnnotations?: any[];
}

type Tool = "select" | "highlight" | "text" | "eraser";

const HIGHLIGHT_COLORS = [
  { value: "#FFEB3B88", label: "צהוב" },
  { value: "#81C78488", label: "ירוק" },
  { value: "#64B5F688", label: "כחול" },
  { value: "#FF8A6588", label: "כתום" },
  { value: "#CE93D888", label: "סגול" },
  { value: "#F48FB188", label: "ורוד" },
];

const FONTS = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "David",
  "Miriam",
  "Narkisim",
];

export const AdvancedPDFEditor = ({
  fileUrl,
  onSave,
  initialAnnotations = [],
}: AdvancedPDFEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  
  const [currentTool, setCurrentTool] = useState<Tool>("select");
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0].value);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [fontSize, setFontSize] = useState(16);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textColor, setTextColor] = useState("#000000");
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [pageHasSelectableText, setPageHasSelectableText] = useState<boolean | null>(null);

  const [ocrResult, setOcrResult] = useState<OcrPageResult | null>(null);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const ocrLayerRef = useRef<HTMLDivElement>(null);

  // Load PDF and render first page
  useEffect(() => {
    const loadPDF = async () => {
      try {
        const loadingTask = pdfjs.getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        await renderPage(pdf, 1);
      } catch (error) {
        console.error("Error loading PDF:", error);
        toast.error("שגיאה בטעינת ה-PDF");
      }
    };

    loadPDF();
  }, [fileUrl]);

  // Render PDF page
  const renderPage = async (pdf: pdfjs.PDFDocumentProxy, pageNum: number) => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    // Detect whether this page has a text layer (many Hebrew books are scanned images).
    // If there is no text layer, “select text and highlight lines” cannot work without OCR.
    try {
      const textContent = await page.getTextContent();
      setPageHasSelectableText((textContent.items?.length ?? 0) > 0);
    } catch {
      setPageHasSelectableText(null);
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Initialize or update Fabric canvas
    if (!fabricCanvasRef.current) {
      const fabricCanvas = new fabric.Canvas("annotationCanvas", {
        width: viewport.width,
        height: viewport.height,
        isDrawingMode: false,
      });
      fabricCanvasRef.current = fabricCanvas;

      // Load saved annotations
      if (initialAnnotations.length > 0) {
        loadAnnotations(fabricCanvas, initialAnnotations);
      }
    } else {
      fabricCanvasRef.current.setDimensions({
        width: viewport.width,
        height: viewport.height,
      });
    }

    // OCR results are page-specific.
    setOcrResult(null);
    setOcrError(null);
  };

  const runOcrForCurrentPage = useCallback(async () => {
    if (!pdfDoc) return;
    try {
      setIsOcrRunning(true);
      setOcrError(null);

      const page = await pdfDoc.getPage(currentPage);
      // Render at a higher scale for better OCR accuracy.
      const viewport = page.getViewport({ scale: 2.5 });
      const ocrCanvas = document.createElement("canvas");
      ocrCanvas.width = viewport.width;
      ocrCanvas.height = viewport.height;
      const ctx = ocrCanvas.getContext("2d");
      if (!ctx) throw new Error("no-canvas-context");

      await page.render({ canvasContext: ctx, viewport }).promise;

      const result = await runHebrewOcrOnCanvas({ canvas: ocrCanvas, lang: "heb" });
      setOcrResult(result);
      toast.success("OCR הסתיים – אפשר לבחור טקסט ולהדגיש");
    } catch (e) {
      console.error(e);
      setOcrError("שגיאה בהרצת OCR. נסה שוב או החלף קובץ.");
      toast.error("שגיאה בהרצת OCR");
    } finally {
      setIsOcrRunning(false);
    }
  }, [pdfDoc, currentPage]);

  const addHighlightsFromSelection = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const layer = ocrLayerRef.current;
    if (!canvas || !layer) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    // Ensure the selection is within our OCR layer.
    if (!layer.contains(range.commonAncestorContainer)) return;

    const layerRect = layer.getBoundingClientRect();
    const rects = Array.from(range.getClientRects())
      .map((r) => ({
        x: r.left - layerRect.left,
        y: r.top - layerRect.top,
        w: r.width,
        h: r.height,
      }))
      .filter((r) => r.w > 2 && r.h > 2);

    if (rects.length === 0) return;

    rects.forEach((r) => {
      const highlight = new fabric.Rect({
        left: r.x,
        top: r.y,
        width: r.w,
        height: r.h,
        fill: highlightColor,
        selectable: true,
        opacity: 0.5,
      });
      canvas.add(highlight);
    });

    canvas.renderAll();
    selection.removeAllRanges();
  }, [highlightColor]);

  // Change page
  const changePage = useCallback(
    async (newPage: number) => {
      if (!pdfDoc || newPage < 1 || newPage > totalPages) return;

      // Save current page annotations before switching
      if (fabricCanvasRef.current) {
        const annotations = fabricCanvasRef.current.toJSON();
        // Here you would save to your backend
      }

      setCurrentPage(newPage);
      await renderPage(pdfDoc, newPage);
    },
    [pdfDoc, totalPages]
  );

  // Tool handlers
  const handleToolChange = (tool: Tool) => {
    setCurrentTool(tool);
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    canvas.selection = tool === "select";

    if (tool === "highlight") {
      canvas.defaultCursor = "crosshair";
    } else if (tool === "text") {
      canvas.defaultCursor = "text";
    } else if (tool === "eraser") {
      canvas.defaultCursor = "pointer";
    } else {
      canvas.defaultCursor = "default";
    }
  };

  // Add text box
  const addTextBox = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const textbox = new fabric.Textbox("הקלד כאן...", {
      left: 100,
      top: 100,
      width: 200,
      fontSize: fontSize,
      fontFamily: selectedFont,
      fill: textColor,
      fontWeight: isBold ? "bold" : "normal",
      fontStyle: isItalic ? "italic" : "normal",
      underline: isUnderline,
      textAlign: "right",
      direction: "rtl",
    });

    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.renderAll();
    toast.success("תיבת טקסט נוספה");
  };

  // Add highlight rectangle
  const addHighlight = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 30,
      fill: highlightColor,
      selectable: true,
      opacity: 0.5,
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
    toast.success("הדגשה נוספה");
  };

  // Update selected text styling
  const updateTextStyle = (property: string, value: any) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === "textbox") {
      (activeObject as any)[property] = value;
      canvas.renderAll();
    }
  };

  // Delete selected object
  const deleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach((obj) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
      toast.success("נמחק בהצלחה");
    }
  };

  // Clear all annotations
  const clearAll = () => {
    if (!window.confirm("למחוק את כל ההערות והסימונים?")) return;

    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.clear();
    toast.success("הכל נמחק");
  };

  // Save annotations
  const saveAnnotations = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const data = canvas.toJSON();
    onSave?.(data);
    toast.success("השינויים נשמרו");
  };

  // Load annotations
  const loadAnnotations = (canvas: fabric.Canvas, data: any) => {
    canvas.loadFromJSON(data, () => {
      canvas.renderAll();
    });
  };

  // Export as image
  const exportAsImage = () => {
    const canvas = fabricCanvasRef.current;
    const pdfCanvas = canvasRef.current;
    if (!canvas || !pdfCanvas) return;

    // Create temporary canvas to merge both layers
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = pdfCanvas.width;
    tempCanvas.height = pdfCanvas.height;
    const ctx = tempCanvas.getContext("2d");
    
    if (!ctx) return;

    // Draw PDF layer
    ctx.drawImage(pdfCanvas, 0, 0);
    
    // Draw annotations layer
    const annotationsImage = new Image();
    annotationsImage.src = canvas.toDataURL();
    annotationsImage.onload = () => {
      ctx.drawImage(annotationsImage, 0, 0);
      
      // Download
      const link = document.createElement("a");
      link.download = `page-${currentPage}.png`;
      link.href = tempCanvas.toDataURL();
      link.click();
      toast.success("הדף נשמר כתמונה");
    };
  };

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Toolbar */}
      <Card className="p-3 mb-3 space-y-3">
        <div className="text-sm text-muted-foreground">
          <div>
            כאן אפשר להוסיף הדגשות/תיבות טקסט מעל ה‑PDF.
            שינויי <strong>בולד/גופן</strong> משפיעים רק על טקסט שאתה מוסיף – לא על הטקסט המקורי בתוך ה‑PDF.
          </div>
          {pageHasSelectableText === false && (
            <div className="mt-1">
              הקובץ נראה כסריקה/תמונה (אין שכבת טקסט), ולכן סימון “לפי שורות/בחירת טקסט” לא יעבוד בלי OCR.
              במצב כזה משתמשים בהדגשת אזור או מוסיפים טקסט חופשי.
            </div>
          )}
          {ocrError && <div className="mt-1 text-destructive">{ocrError}</div>}
        </div>

        {/* Tool Selection */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={currentTool === "select" ? "default" : "outline"}
            size="sm"
            onClick={() => handleToolChange("select")}
            className="gap-1"
          >
            <MousePointer className="w-4 h-4" />
            בחירה
          </Button>
          <Button
            variant={currentTool === "highlight" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              handleToolChange("highlight");
              addHighlight();
            }}
            className="gap-1"
          >
            <Highlighter className="w-4 h-4" />
            הדגשה
          </Button>
          <Button
            variant={currentTool === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              handleToolChange("text");
              addTextBox();
            }}
            className="gap-1"
          >
            <Type className="w-4 h-4" />
            טקסט
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={runOcrForCurrentPage}
            disabled={isOcrRunning}
            className="gap-1"
            title="OCR בעברית (יעבוד הכי טוב על סריקות). בפעם הראשונה יוריד מודל שפה וזה יכול לקחת קצת זמן."
          >
            <Sparkles className="w-4 h-4" />
            {isOcrRunning ? "מריץ OCR..." : "הרץ OCR"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deleteSelected}
            className="gap-1"
          >
            <Trash2 className="w-4 h-4" />
            מחק
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="gap-1"
          >
            <Eraser className="w-4 h-4" />
            נקה הכל
          </Button>
        </div>

        {/* Text Styling */}
        <div className="flex items-center gap-2 flex-wrap border-t pt-3">
          <Select value={selectedFont} onValueChange={(val) => {
            setSelectedFont(val);
            updateTextStyle("fontFamily", val);
          }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((font) => (
                <SelectItem key={font} value={font}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={fontSize.toString()} onValueChange={(val) => {
            const size = parseInt(val);
            setFontSize(size);
            updateTextStyle("fontSize", size);
          }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[12, 14, 16, 18, 20, 24, 28, 32, 36].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={isBold ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsBold(!isBold);
              updateTextStyle("fontWeight", !isBold ? "bold" : "normal");
            }}
          >
            <Bold className="w-4 h-4" />
          </Button>

          <Button
            variant={isItalic ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsItalic(!isItalic);
              updateTextStyle("fontStyle", !isItalic ? "italic" : "normal");
            }}
          >
            <Italic className="w-4 h-4" />
          </Button>

          <Button
            variant={isUnderline ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsUnderline(!isUnderline);
              updateTextStyle("underline", !isUnderline);
            }}
          >
            <Underline className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2">
            <label className="text-sm">צבע:</label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => {
                setTextColor(e.target.value);
                updateTextStyle("fill", e.target.value);
              }}
              className="w-10 h-8 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">צבע הדגשה:</label>
            <Select value={highlightColor} onValueChange={setHighlightColor}>
              <SelectTrigger className="w-24">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: highlightColor }}
                  />
                </div>
              </SelectTrigger>
              <SelectContent>
                {HIGHLIGHT_COLORS.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: color.value }}
                      />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={saveAnnotations}>
              שמור שינויים
            </Button>
            <Button size="sm" variant="outline" onClick={exportAsImage}>
              <Download className="w-4 h-4 mr-1" />
              ייצא כתמונה
            </Button>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              קודם
            </Button>
            <span className="text-sm">
              עמוד {currentPage} מתוך {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              הבא
            </Button>
          </div>
        </div>
      </Card>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4 relative"
      >
        <div className="relative inline-block">
          {/* PDF Layer */}
          <canvas ref={canvasRef} className="absolute top-0 left-0" />
          
          {/* Annotations Layer */}
          <canvas id="annotationCanvas" className="absolute top-0 left-0" />

          {/* OCR selectable text layer (invisible text for selection) */}
          {ocrResult && (
            <div
              ref={ocrLayerRef}
              className="absolute top-0 left-0 select-text"
              onMouseUp={addHighlightsFromSelection}
              style={{
                width: canvasRef.current?.width ?? undefined,
                height: canvasRef.current?.height ?? undefined,
                direction: "rtl",
                unicodeBidi: "plaintext",
                // keep text invisible but selectable
                color: "transparent",
                WebkitTextFillColor: "transparent",
              }}
            >
              {ocrResult.words.map((w, idx) => {
                const width = Math.max(0, w.x1 - w.x0);
                const height = Math.max(0, w.y1 - w.y0);
                return (
                  <span
                    key={idx}
                    data-ocr-word="1"
                    style={{
                      position: "absolute",
                      left: w.x0,
                      top: w.y0,
                      width,
                      height,
                      fontSize: Math.max(10, height * 0.9),
                      lineHeight: `${Math.max(10, height)}px`,
                      whiteSpace: "pre",
                      userSelect: "text",
                      pointerEvents: "auto",
                    }}
                  >
                    {w.text + " "}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
