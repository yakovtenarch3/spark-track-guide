import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2 } from "lucide-react";
import { toast } from "sonner";
import type { Theme } from "@/hooks/useTheme";

interface CustomThemeDialogProps {
  onSaveTheme: (name: string, colors: {
    background: string;
    primary: string;
    secondary: string;
  }) => void;
  editTheme?: Theme;
  onEditComplete?: () => void;
  trigger?: React.ReactNode;
}

export const CustomThemeDialog = ({ onSaveTheme, editTheme, onEditComplete, trigger }: CustomThemeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [themeName, setThemeName] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#f5f0e8");
  const [primaryColor, setPrimaryColor] = useState("#0d2a4b");
  const [secondaryColor, setSecondaryColor] = useState("#1a4d7a");

  // Convert HSL to Hex
  const hslToHex = (hsl: string): string => {
    const [h, s, l] = hsl.split(/\s+/).map((v, i) => i === 0 ? parseInt(v) : parseFloat(v));
    const sDecimal = s / 100;
    const lDecimal = l / 100;
    const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = lDecimal - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Load edit theme data when editTheme changes
  useEffect(() => {
    if (editTheme && open) {
      setThemeName(editTheme.label);
      setBackgroundColor(hslToHex(editTheme.colors.background));
      setPrimaryColor(hslToHex(editTheme.colors.primary));
      setSecondaryColor(hslToHex(editTheme.colors.secondary));
    }
  }, [editTheme, open]);

  const hexToHSL = (hex: string): string => {
    // Remove # if present
    hex = hex.replace(/^#/, "");

    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
  };

  const handleSave = () => {
    if (!themeName.trim()) {
      toast.error("נא להזין שם לערכת הנושא");
      return;
    }

    const colors = {
      background: hexToHSL(backgroundColor),
      primary: hexToHSL(primaryColor),
      secondary: hexToHSL(secondaryColor),
    };

    onSaveTheme(themeName, colors);
    toast.success(`ערכת נושא "${themeName}" ${editTheme ? 'עודכנה' : 'נשמרה'} בהצלחה!`);
    
    // Reset and close
    setThemeName("");
    setBackgroundColor("#f5f0e8");
    setPrimaryColor("#0d2a4b");
    setSecondaryColor("#1a4d7a");
    setOpen(false);
    onEditComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start gap-2">
            <Plus className="w-4 h-4" />
            צור ערכת נושא מותאמת אישית
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editTheme ? 'ערוך ערכת נושא' : 'צור ערכת נושא חדשה'}</DialogTitle>
          <DialogDescription>
            בחר צבעים ליצירת ערכת נושא מותאמת אישית
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">שם ערכת הנושא</Label>
            <Input
              id="name"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              placeholder="לדוגמה: הערכה שלי"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bg">צבע רקע</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="bg"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-20 h-10 p-1 cursor-pointer"
              />
              <Input
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder="#f5f0e8"
                className="flex-1"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="primary">צבע ראשי</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="primary"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-20 h-10 p-1 cursor-pointer"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#0d2a4b"
                className="flex-1"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="secondary">צבע משני</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="secondary"
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-20 h-10 p-1 cursor-pointer"
              />
              <Input
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="#1a4d7a"
                className="flex-1"
              />
            </div>
          </div>
          <div className="border rounded-lg p-4" style={{ backgroundColor }}>
            <div
              className="rounded-lg p-3 text-center font-medium"
              style={{ 
                backgroundColor: primaryColor,
                color: '#ffffff'
              }}
            >
              תצוגה מקדימה - צבע ראשי
            </div>
            <div
              className="rounded-lg p-2 mt-2 text-center text-sm"
              style={{ 
                backgroundColor: secondaryColor,
                color: '#ffffff'
              }}
            >
              תצוגה מקדימה - צבע משני
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>שמור ערכת נושא</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
