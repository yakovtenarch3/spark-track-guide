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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Theme } from "@/hooks/useTheme";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExtendedThemeColors {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  card?: string;
  cardBorder?: string;
  fontColor?: string;
  headingColor?: string;
  borderColor?: string;
  buttonBg?: string;
  buttonText?: string;
  accent?: string;
}

interface CustomThemeDialogProps {
  onSaveTheme: (name: string, colors: ExtendedThemeColors) => void;
  editTheme?: Theme | null;
  onEditComplete?: () => void;
  trigger?: React.ReactNode;
}

export const CustomThemeDialog = ({ onSaveTheme, editTheme, onEditComplete, trigger }: CustomThemeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [themeName, setThemeName] = useState("");
  
  // Basic colors
  const [backgroundColor, setBackgroundColor] = useState("#f5f0e8");
  const [primaryColor, setPrimaryColor] = useState("#1a3a5c");
  const [secondaryColor, setSecondaryColor] = useState("#d4a84b");
  
  // Extended colors
  const [fontColor, setFontColor] = useState("#1a3a5c");
  const [headingColor, setHeadingColor] = useState("#0d2a4b");
  const [cardColor, setCardColor] = useState("#ffffff");
  const [cardBorderColor, setCardBorderColor] = useState("#d4a84b");
  const [borderColor, setBorderColor] = useState("#d4a84b");
  const [buttonBgColor, setButtonBgColor] = useState("#ffffff");
  const [buttonTextColor, setButtonTextColor] = useState("#1a3a5c");
  const [accentColor, setAccentColor] = useState("#d4a84b");

  // Convert HSL to Hex
  const hslToHex = (hsl: string): string => {
    if (!hsl) return "#000000";
    const parts = hsl.split(/\s+/);
    if (parts.length < 3) return "#000000";
    
    const h = parseInt(parts[0]) || 0;
    const s = parseFloat(parts[1]) || 0;
    const l = parseFloat(parts[2]) || 0;
    
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
      setFontColor(hslToHex(editTheme.colors.fontColor || editTheme.colors.foreground));
      setHeadingColor(hslToHex(editTheme.colors.headingColor || editTheme.colors.foreground));
      setCardColor(hslToHex(editTheme.colors.card));
      setCardBorderColor(hslToHex(editTheme.colors.cardBorder || editTheme.colors.border));
      setBorderColor(hslToHex(editTheme.colors.borderColor || editTheme.colors.border));
      setButtonBgColor(hslToHex(editTheme.colors.buttonBg || editTheme.colors.primary));
      setButtonTextColor(hslToHex(editTheme.colors.buttonText || editTheme.colors.primaryForeground));
      setAccentColor(hslToHex(editTheme.colors.accent));
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

    const colors: ExtendedThemeColors = {
      background: hexToHSL(backgroundColor),
      foreground: hexToHSL(fontColor),
      primary: hexToHSL(primaryColor),
      secondary: hexToHSL(secondaryColor),
      card: hexToHSL(cardColor),
      cardBorder: hexToHSL(cardBorderColor),
      fontColor: hexToHSL(fontColor),
      headingColor: hexToHSL(headingColor),
      borderColor: hexToHSL(borderColor),
      buttonBg: hexToHSL(buttonBgColor),
      buttonText: hexToHSL(buttonTextColor),
      accent: hexToHSL(accentColor),
    };

    onSaveTheme(themeName, colors);
    toast.success(`ערכת נושא "${themeName}" ${editTheme ? 'עודכנה' : 'נשמרה'} בהצלחה!`);
    
    // Reset and close
    resetForm();
    setOpen(false);
    onEditComplete?.();
  };

  const resetForm = () => {
    setThemeName("");
    setBackgroundColor("#f5f0e8");
    setPrimaryColor("#1a3a5c");
    setSecondaryColor("#d4a84b");
    setFontColor("#1a3a5c");
    setHeadingColor("#0d2a4b");
    setCardColor("#ffffff");
    setCardBorderColor("#d4a84b");
    setBorderColor("#d4a84b");
    setButtonBgColor("#ffffff");
    setButtonTextColor("#1a3a5c");
    setAccentColor("#d4a84b");
  };

  const ColorInput = ({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string; 
    value: string; 
    onChange: (value: string) => void 
  }) => (
    <div className="grid gap-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2 items-center">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-14 h-10 p-1 cursor-pointer border-2"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
        />
      </div>
    </div>
  );

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editTheme ? 'ערוך ערכת נושא' : 'צור ערכת נושא חדשה'}</DialogTitle>
          <DialogDescription>
            התאם אישית את כל הצבעים ליצירת ערכת נושא ייחודית
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">שם ערכת הנושא</Label>
              <Input
                id="name"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="לדוגמה: הערכה שלי"
              />
            </div>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">בסיסי</TabsTrigger>
                <TabsTrigger value="typography">טיפוגרפיה</TabsTrigger>
                <TabsTrigger value="advanced">מתקדם</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-4">
                <ColorInput
                  label="צבע רקע ראשי"
                  value={backgroundColor}
                  onChange={setBackgroundColor}
                />
                <ColorInput
                  label="צבע ראשי (Primary)"
                  value={primaryColor}
                  onChange={setPrimaryColor}
                />
                <ColorInput
                  label="צבע משני (Secondary)"
                  value={secondaryColor}
                  onChange={setSecondaryColor}
                />
                <ColorInput
                  label="צבע הדגשה (Accent)"
                  value={accentColor}
                  onChange={setAccentColor}
                />
              </TabsContent>

              <TabsContent value="typography" className="space-y-4 mt-4">
                <ColorInput
                  label="צבע גופן ראשי"
                  value={fontColor}
                  onChange={setFontColor}
                />
                <ColorInput
                  label="צבע כותרות"
                  value={headingColor}
                  onChange={setHeadingColor}
                />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-4">
                <ColorInput
                  label="צבע רקע כרטיסים/מסגרות"
                  value={cardColor}
                  onChange={setCardColor}
                />
                <ColorInput
                  label="צבע גבול כרטיסים/מסגרות"
                  value={cardBorderColor}
                  onChange={setCardBorderColor}
                />
                <ColorInput
                  label="צבע גבולות כללי"
                  value={borderColor}
                  onChange={setBorderColor}
                />
                <ColorInput
                  label="צבע רקע כפתורים"
                  value={buttonBgColor}
                  onChange={setButtonBgColor}
                />
                <ColorInput
                  label="צבע טקסט כפתורים"
                  value={buttonTextColor}
                  onChange={setButtonTextColor}
                />
              </TabsContent>
            </Tabs>

            {/* Live Preview */}
            <div className="mt-6 space-y-3">
              <Label className="font-medium">תצוגה מקדימה</Label>
              <div 
                className="rounded-xl p-6 space-y-4 transition-all"
                style={{ backgroundColor }}
              >
                <h3 
                  className="text-xl font-bold"
                  style={{ color: headingColor }}
                >
                  כותרת לדוגמה
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: fontColor }}
                >
                  זהו טקסט לדוגמה שמציג את צבע הגופן הראשי שבחרת.
                </p>
                
                <div 
                  className="rounded-lg p-4"
                  style={{ 
                    backgroundColor: cardColor,
                    border: `2px solid ${cardBorderColor}`
                  }}
                >
                  <p 
                    className="text-sm font-medium"
                    style={{ color: fontColor }}
                  >
                    דוגמה לכרטיס/מסגרת
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
                    style={{ 
                      backgroundColor: buttonBgColor,
                      color: buttonTextColor,
                      border: `2px solid ${borderColor}`
                    }}
                  >
                    כפתור ראשי
                  </button>
                  <button
                    className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
                    style={{ 
                      backgroundColor: primaryColor,
                      color: "#ffffff"
                    }}
                  >
                    כפתור משני
                  </button>
                </div>

                <div 
                  className="h-2 rounded-full"
                  style={{ backgroundColor: accentColor }}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave}>
            שמור ערכת נושא
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};