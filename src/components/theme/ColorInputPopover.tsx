import { useState, useRef, useEffect, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCAL_STORAGE_KEY = "savedColors";

const DEFAULT_SWATCHES = [
  "#1a3a5c",
  "#d4a84b",
  "#ffffff",
  "#f5f0e8",
  "#0d2a4b",
  "#50C878",
  "#FF6B6B",
  "#A78BFA",
];

// Calculate relative luminance
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Check if colors need contrast adjustment
export function needsContrastFix(bgHex: string, fgHex: string): boolean {
  const bgLum = getLuminance(bgHex);
  const fgLum = getLuminance(fgHex);
  const lighter = Math.max(bgLum, fgLum);
  const darker = Math.min(bgLum, fgLum);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return ratio < 2.5; // Low contrast threshold
}

// Get a contrasting color
export function getContrastingColor(bgHex: string): string {
  const lum = getLuminance(bgHex);
  return lum > 0.5 ? "#1a1a1a" : "#ffffff";
}

interface ColorInputPopoverProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  contrastWith?: string; // If provided, will show warning when colors are too similar
}

export const ColorInputPopover = ({
  label,
  value,
  onChange,
  contrastWith,
}: ColorInputPopoverProps) => {
  const [open, setOpen] = useState(false);
  const [savedColors, setSavedColors] = useState<string[]>([]);
  const [editingSwatchIndex, setEditingSwatchIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved colors from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setSavedColors(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save colors to localStorage
  const saveSavedColors = (colors: string[]) => {
    setSavedColors(colors);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(colors));
  };

  const handleAddCurrentColor = () => {
    if (!savedColors.includes(value)) {
      saveSavedColors([...savedColors, value]);
    }
  };

  const handleRemoveSavedColor = (index: number) => {
    const updated = savedColors.filter((_, i) => i !== index);
    saveSavedColors(updated);
    setEditingSwatchIndex(null);
  };

  const handleReplaceColor = (index: number) => {
    const updated = [...savedColors];
    updated[index] = value;
    saveSavedColors(updated);
    setEditingSwatchIndex(null);
  };

  // Check contrast warning
  const showContrastWarning = useMemo(() => {
    if (!contrastWith) return false;
    return needsContrastFix(value, contrastWith);
  }, [value, contrastWith]);

  const suggestedContrast = useMemo(() => {
    if (!contrastWith) return null;
    return getContrastingColor(contrastWith);
  }, [contrastWith]);

  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-10"
            type="button"
          >
            <div
              className="w-6 h-6 rounded border border-border flex-shrink-0"
              style={{ backgroundColor: value }}
            />
            <span className="font-mono text-xs">{value}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-72 p-4 bg-popover z-[100]"
          align="start"
          side="bottom"
          onInteractOutside={(e) => {
            // Prevent closing when clicking inside color input
            if ((e.target as HTMLElement)?.closest('input[type="color"]')) {
              e.preventDefault();
            }
          }}
          onPointerDownOutside={(e) => {
            // Prevent closing when interacting with color picker
            if ((e.target as HTMLElement)?.closest('input[type="color"]')) {
              e.preventDefault();
            }
          }}
        >
          <div className="space-y-4">
            {/* Native Color Picker */}
            <div className="flex gap-2 items-center">
              <Input
                ref={inputRef}
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-14 h-10 p-1 cursor-pointer border-2 rounded-lg"
              />
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="flex-1 font-mono text-xs h-10"
              />
            </div>

            {/* Contrast Warning */}
            {showContrastWarning && (
              <div className="p-2 rounded-lg bg-warning/10 border border-warning/30 text-xs text-warning-foreground">
                <p className="font-medium">⚠️ ניגודיות נמוכה</p>
                <p className="text-muted-foreground">
                  הטקסט עלול להיות קשה לקריאה.
                </p>
                {suggestedContrast && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs gap-2"
                    onClick={() => onChange(suggestedContrast)}
                  >
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: suggestedContrast }}
                    />
                    השתמש בצבע מנוגד
                  </Button>
                )}
              </div>
            )}

            {/* Default Swatches */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">צבעים מהירים</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_SWATCHES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onChange(color)}
                    className={cn(
                      "w-7 h-7 rounded-lg border-2 transition-all hover:scale-110",
                      value === color ? "border-primary ring-2 ring-primary/30" : "border-border"
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Saved Colors */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">צבעים שמורים</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1"
                  onClick={handleAddCurrentColor}
                >
                  <Plus className="w-3 h-3" />
                  שמור צבע נוכחי
                </Button>
              </div>
              {savedColors.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {savedColors.map((color, index) => (
                    <div key={`${color}-${index}`} className="relative group">
                      <button
                        type="button"
                        onClick={() => {
                          if (editingSwatchIndex === index) {
                            setEditingSwatchIndex(null);
                          } else {
                            onChange(color);
                          }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setEditingSwatchIndex(editingSwatchIndex === index ? null : index);
                        }}
                        className={cn(
                          "w-7 h-7 rounded-lg border-2 transition-all hover:scale-110",
                          value === color ? "border-primary ring-2 ring-primary/30" : "border-border"
                        )}
                        style={{ backgroundColor: color }}
                        title={`${color} (לחיצה ימנית לעריכה)`}
                      />
                      {editingSwatchIndex === index && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 bg-popover border rounded-lg p-1 shadow-lg z-10">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleReplaceColor(index)}
                            title="החלף בצבע הנוכחי"
                          >
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: value }}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveSavedColor(index)}
                            title="מחק"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setEditingSwatchIndex(null)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  לחץ "שמור צבע נוכחי" להוספת צבעים לרשימה
                </p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
