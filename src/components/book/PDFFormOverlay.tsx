import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Type,
  CheckSquare,
  Circle,
  Square,
  Pencil,
  Eraser,
  Trash2,
  Save,
  X,
  Move,
  RotateCcw,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface FormElement {
  id: string;
  type: "text" | "textarea" | "checkbox" | "circle" | "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  checked?: boolean;
  color?: string;
}

interface DrawingPath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

interface PDFFormOverlayProps {
  pageNumber: number;
  bookId: string;
  width: number;
  height: number;
  onClose: () => void;
}

const ELEMENT_COLORS = [
  { value: "#1a1a1a", label: "שחור" },
  { value: "#3b82f6", label: "כחול" },
  { value: "#ef4444", label: "אדום" },
  { value: "#22c55e", label: "ירוק" },
  { value: "#8b5cf6", label: "סגול" },
];

export const PDFFormOverlay = ({
  pageNumber,
  bookId,
  width,
  height,
  onClose,
}: PDFFormOverlayProps) => {
  const [elements, setElements] = useState<FormElement[]>(() => {
    const saved = localStorage.getItem(`pdf-form-${bookId}-${pageNumber}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [drawings, setDrawings] = useState<DrawingPath[]>(() => {
    const saved = localStorage.getItem(`pdf-drawings-${bookId}-${pageNumber}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeTool, setActiveTool] = useState<"select" | "text" | "textarea" | "checkbox" | "draw" | "erase">("select");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [drawColor, setDrawColor] = useState("#1a1a1a");
  const [drawWidth, setDrawWidth] = useState(2);
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Save elements to localStorage
  useEffect(() => {
    localStorage.setItem(`pdf-form-${bookId}-${pageNumber}`, JSON.stringify(elements));
  }, [elements, bookId, pageNumber]);

  // Save drawings to localStorage
  useEffect(() => {
    localStorage.setItem(`pdf-drawings-${bookId}-${pageNumber}`, JSON.stringify(drawings));
  }, [drawings, bookId, pageNumber]);

  // Render drawings on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawings.forEach((path) => {
      if (path.points.length < 2) return;
      
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    });

    // Draw current path
    if (currentPath.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = drawWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
    }
  }, [drawings, currentPath, drawColor, drawWidth]);

  const getRelativePosition = (e: React.MouseEvent) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (activeTool === "select" || activeTool === "draw" || activeTool === "erase") return;
    
    const pos = getRelativePosition(e);
    const id = `el-${Date.now()}`;

    const newElement: FormElement = {
      id,
      type: activeTool === "textarea" ? "textarea" : activeTool === "checkbox" ? "checkbox" : "text",
      x: pos.x,
      y: pos.y,
      width: activeTool === "textarea" ? 200 : activeTool === "checkbox" ? 24 : 150,
      height: activeTool === "textarea" ? 80 : activeTool === "checkbox" ? 24 : 32,
      value: "",
      checked: false,
      color: drawColor,
    };

    setElements([...elements, newElement]);
    setSelectedElement(id);
    setActiveTool("select");
    toast.success("אלמנט נוסף!");
  };

  const handleMouseDown = (e: React.MouseEvent, elementId?: string) => {
    const pos = getRelativePosition(e);

    if (activeTool === "draw") {
      e.preventDefault();
      setIsDrawing(true);
      setCurrentPath([pos]);
      return;
    }

    if (activeTool === "erase") {
      // Remove drawing paths that are near the click
      setDrawings((prev) =>
        prev.filter((path) => {
          return !path.points.some(
            (point) => Math.abs(point.x - pos.x) < 10 && Math.abs(point.y - pos.y) < 10
          );
        })
      );
      return;
    }

    if (elementId && activeTool === "select") {
      e.stopPropagation();
      setSelectedElement(elementId);
      setIsDragging(true);
      const element = elements.find((el) => el.id === elementId);
      if (element) {
        setDragOffset({
          x: pos.x - element.x,
          y: pos.y - element.y,
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getRelativePosition(e);

    if (isDrawing && activeTool === "draw") {
      setCurrentPath((prev) => [...prev, pos]);
      return;
    }

    if (isDragging && selectedElement) {
      setElements((prev) =>
        prev.map((el) =>
          el.id === selectedElement
            ? { ...el, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
            : el
        )
      );
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentPath.length > 1) {
      const newPath: DrawingPath = {
        id: `draw-${Date.now()}`,
        points: currentPath,
        color: drawColor,
        width: drawWidth,
      };
      setDrawings((prev) => [...prev, newPath]);
    }
    
    setIsDragging(false);
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const updateElement = (id: string, updates: Partial<FormElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const deleteElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedElement(null);
    toast.success("האלמנט נמחק");
  };

  const clearAll = () => {
    setElements([]);
    setDrawings([]);
    setSelectedElement(null);
    toast.success("כל התוכן נמחק");
  };

  const saveAsImage = async () => {
    // This would require html2canvas or similar library
    toast.success("הנתונים נשמרו אוטומטית!");
  };

  return (
    <div className="absolute inset-0 z-20">
      {/* Toolbar */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-card/95 backdrop-blur-sm border-2 border-primary/30 rounded-xl p-2 shadow-xl">
        <div className="flex gap-0.5 p-0.5 bg-muted rounded-lg">
          <Button
            variant={activeTool === "select" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setActiveTool("select")}
            title="בחירה והזזה"
          >
            <Move className="w-4 h-4" />
          </Button>
          <Button
            variant={activeTool === "text" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setActiveTool("text")}
            title="שדה טקסט"
          >
            <Type className="w-4 h-4" />
          </Button>
          <Button
            variant={activeTool === "textarea" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setActiveTool("textarea")}
            title="תיבת טקסט גדולה"
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button
            variant={activeTool === "checkbox" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setActiveTool("checkbox")}
            title="תיבת סימון"
          >
            <CheckSquare className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border mx-1" />

        <div className="flex gap-0.5 p-0.5 bg-muted rounded-lg">
          <Button
            variant={activeTool === "draw" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setActiveTool("draw")}
            title="ציור חופשי"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant={activeTool === "erase" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setActiveTool("erase")}
            title="מחק ציור"
          >
            <Eraser className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border mx-1" />

        {/* Color Picker */}
        <div className="flex gap-1">
          {ELEMENT_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => setDrawColor(color.value)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                drawColor === color.value
                  ? "border-primary scale-110 ring-2 ring-primary/50"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
        </div>

        <div className="h-6 w-px bg-border mx-1" />

        {/* Line Width */}
        {activeTool === "draw" && (
          <div className="flex gap-1 items-center">
            {[1, 2, 4, 6].map((w) => (
              <button
                key={w}
                onClick={() => setDrawWidth(w)}
                className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                  drawWidth === w ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                }`}
                title={`עובי ${w}`}
              >
                <div
                  className="rounded-full bg-current"
                  style={{ width: w * 2, height: w * 2 }}
                />
              </button>
            ))}
          </div>
        )}

        <div className="h-6 w-px bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={clearAll}
          title="נקה הכל"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
          title="סגור מצב עריכה"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Overlay Area */}
      <div
        ref={overlayRef}
        className={`absolute inset-0 ${
          activeTool !== "select" ? "cursor-crosshair" : ""
        }`}
        onClick={handleOverlayClick}
        onMouseDown={(e) => handleMouseDown(e)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Drawing Canvas */}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="absolute inset-0 pointer-events-none"
        />

        {/* Form Elements */}
        {elements.map((element) => (
          <div
            key={element.id}
            className={`absolute transition-shadow ${
              selectedElement === element.id
                ? "ring-2 ring-primary shadow-lg"
                : "hover:ring-1 hover:ring-primary/50"
            }`}
            style={{
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
          >
            {element.type === "text" && (
              <Input
                value={element.value}
                onChange={(e) => updateElement(element.id, { value: e.target.value })}
                className="h-full w-full text-sm bg-background/90 border-primary/30"
                placeholder="הקלד כאן..."
                onClick={(e) => e.stopPropagation()}
              />
            )}

            {element.type === "textarea" && (
              <Textarea
                value={element.value}
                onChange={(e) => updateElement(element.id, { value: e.target.value })}
                className="h-full w-full text-sm resize-none bg-background/90 border-primary/30"
                placeholder="הקלד כאן..."
                onClick={(e) => e.stopPropagation()}
              />
            )}

            {element.type === "checkbox" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateElement(element.id, { checked: !element.checked });
                }}
                className={`h-full w-full rounded border-2 transition-all flex items-center justify-center ${
                  element.checked
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background/90 border-primary/50 hover:border-primary"
                }`}
              >
                {element.checked && <CheckSquare className="w-4 h-4" />}
              </button>
            )}

            {/* Delete button for selected element */}
            {selectedElement === element.id && (
              <button
                className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteElement(element.id);
                }}
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Resize handle */}
            {selectedElement === element.id && element.type !== "checkbox" && (
              <div
                className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-primary rounded-full cursor-se-resize shadow-md"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  // Simple resize logic could be added here
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Instructions Card */}
      <Card className="absolute bottom-4 left-4 p-3 bg-card/95 backdrop-blur-sm border-primary/30 max-w-xs">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">טיפ:</span> בחרו כלי מהסרגל ולחצו על העמוד להוספת אלמנט. גררו אלמנטים להזזה.
        </p>
      </Card>

      {/* Page indicator */}
      <div className="absolute bottom-4 right-4 bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
        עמוד {pageNumber} - מצב עריכה
      </div>
    </div>
  );
};
