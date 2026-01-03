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
import { Plus, Home, Target, Trophy, Settings } from "lucide-react";
import { toast } from "sonner";
import type { Theme } from "@/hooks/useTheme";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ColorInputPopover, needsContrastFix, getContrastingColor } from "@/components/theme/ColorInputPopover";

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
  sidebarBackground?: string;
  sidebarForeground?: string;
  sidebarBorder?: string;
}

interface CustomThemeDialogProps {
  onSaveTheme: (name: string, colors: ExtendedThemeColors) => void;
  editTheme?: Theme | null;
  onEditComplete?: () => void;
  trigger?: React.ReactNode;
  defaultValues?: { name: string; colors: ExtendedThemeColors };
}

export const CustomThemeDialog = ({ onSaveTheme, editTheme, onEditComplete, trigger, defaultValues }: CustomThemeDialogProps) => {
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

  // Sidebar colors
  const [sidebarBgColor, setSidebarBgColor] = useState("#f5f0e8");
  const [sidebarTextColor, setSidebarTextColor] = useState("#1a3a5c");
  const [sidebarBorderColor, setSidebarBorderColor] = useState("#d4a84b");
  
  // Sidebar font settings
  const [sidebarFontBold, setSidebarFontBold] = useState(false);
  const [sidebarFontFamily, setSidebarFontFamily] = useState("inherit");
  
  // Sidebar border & radius settings
  const [sidebarBorderWidth, setSidebarBorderWidth] = useState<"thin" | "medium" | "thick">("thin");
  const [sidebarBorderRadius, setSidebarBorderRadius] = useState<"small" | "medium" | "large">("medium");

  // Auto-fix contrast when background changes
  useEffect(() => {
    if (needsContrastFix(backgroundColor, fontColor)) {
      setFontColor(getContrastingColor(backgroundColor));
    }
    if (needsContrastFix(backgroundColor, headingColor)) {
      setHeadingColor(getContrastingColor(backgroundColor));
    }
  }, [backgroundColor]);

  useEffect(() => {
    if (needsContrastFix(cardColor, fontColor)) {
      // Only auto-fix if font color wasn't manually set
    }
  }, [cardColor]);

  useEffect(() => {
    if (needsContrastFix(buttonBgColor, buttonTextColor)) {
      setButtonTextColor(getContrastingColor(buttonBgColor));
    }
  }, [buttonBgColor]);

  useEffect(() => {
    if (needsContrastFix(sidebarBgColor, sidebarTextColor)) {
      setSidebarTextColor(getContrastingColor(sidebarBgColor));
    }
  }, [sidebarBgColor]);

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
      setSidebarBgColor(hslToHex(editTheme.colors.sidebarBackground || editTheme.colors.background));
      setSidebarTextColor(hslToHex(editTheme.colors.sidebarForeground || editTheme.colors.foreground));
      setSidebarBorderColor(hslToHex(editTheme.colors.sidebarBorder || editTheme.colors.border));
    }
  }, [editTheme, open]);

  // Load default values for built-in themes (create copy)
  useEffect(() => {
    if (defaultValues && open && !editTheme) {
      setThemeName(defaultValues.name);
      setBackgroundColor(hslToHex(defaultValues.colors.background));
      setPrimaryColor(hslToHex(defaultValues.colors.primary));
      setSecondaryColor(hslToHex(defaultValues.colors.secondary));
      if (defaultValues.colors.fontColor) setFontColor(hslToHex(defaultValues.colors.fontColor));
      if (defaultValues.colors.headingColor) setHeadingColor(hslToHex(defaultValues.colors.headingColor));
      if (defaultValues.colors.card) setCardColor(hslToHex(defaultValues.colors.card));
      if (defaultValues.colors.cardBorder) setCardBorderColor(hslToHex(defaultValues.colors.cardBorder));
      if (defaultValues.colors.borderColor) setBorderColor(hslToHex(defaultValues.colors.borderColor));
      if (defaultValues.colors.buttonBg) setButtonBgColor(hslToHex(defaultValues.colors.buttonBg));
      if (defaultValues.colors.buttonText) setButtonTextColor(hslToHex(defaultValues.colors.buttonText));
      if (defaultValues.colors.accent) setAccentColor(hslToHex(defaultValues.colors.accent));
      if (defaultValues.colors.sidebarBackground) setSidebarBgColor(hslToHex(defaultValues.colors.sidebarBackground));
      if (defaultValues.colors.sidebarForeground) setSidebarTextColor(hslToHex(defaultValues.colors.sidebarForeground));
      if (defaultValues.colors.sidebarBorder) setSidebarBorderColor(hslToHex(defaultValues.colors.sidebarBorder));
    }
  }, [defaultValues, open, editTheme]);

  const hexToHSL = (hex: string): string => {
    hex = hex.replace(/^#/, "");
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
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
      sidebarBackground: hexToHSL(sidebarBgColor),
      sidebarForeground: hexToHSL(sidebarTextColor),
      sidebarBorder: hexToHSL(sidebarBorderColor),
    };

    onSaveTheme(themeName, colors);
    toast.success(`ערכת נושא "${themeName}" ${editTheme ? 'עודכנה' : 'נשמרה'} בהצלחה!`);
    
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
    setSidebarBgColor("#f5f0e8");
    setSidebarTextColor("#1a3a5c");
    setSidebarBorderColor("#d4a84b");
  };

  const sidebarItems = [
    { icon: Home, label: "בית" },
    { icon: Target, label: "הרגלים" },
    { icon: Trophy, label: "הישגים" },
    { icon: Settings, label: "הגדרות" },
  ];

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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editTheme ? 'ערוך ערכת נושא' : 'צור ערכת נושא חדשה'}</DialogTitle>
          <DialogDescription>
            התאם אישית את כל הצבעים כולל סיידבר וכרטיסים
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Color Settings */}
          <ScrollArea className="max-h-[55vh] pr-4">
            <div className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="name" className="font-medium">שם ערכת הנושא</Label>
                <Input
                  id="name"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  placeholder="לדוגמה: הערכה שלי"
                />
              </div>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4 text-xs">
                  <TabsTrigger value="basic">בסיסי</TabsTrigger>
                  <TabsTrigger value="typography">טקסט</TabsTrigger>
                  <TabsTrigger value="cards">כרטיסים</TabsTrigger>
                  <TabsTrigger value="sidebar">סיידבר</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-3 mt-3">
                  <ColorInputPopover label="צבע רקע ראשי" value={backgroundColor} onChange={setBackgroundColor} />
                  <ColorInputPopover label="צבע ראשי (Primary)" value={primaryColor} onChange={setPrimaryColor} />
                  <ColorInputPopover label="צבע משני (Secondary)" value={secondaryColor} onChange={setSecondaryColor} />
                  <ColorInputPopover label="צבע הדגשה (Accent)" value={accentColor} onChange={setAccentColor} />
                </TabsContent>

                <TabsContent value="typography" className="space-y-3 mt-3">
                  <Separator className="my-2" />
                  <p className="text-xs text-muted-foreground font-medium">צבעי טקסט</p>
                  <ColorInputPopover label="צבע גופן ראשי" value={fontColor} onChange={setFontColor} contrastWith={backgroundColor} />
                  <ColorInputPopover label="צבע כותרות" value={headingColor} onChange={setHeadingColor} contrastWith={backgroundColor} />
                  <Separator className="my-2" />
                  <p className="text-xs text-muted-foreground font-medium">כפתורים</p>
                  <ColorInputPopover label="צבע טקסט כפתורים" value={buttonTextColor} onChange={setButtonTextColor} contrastWith={buttonBgColor} />
                </TabsContent>

                <TabsContent value="cards" className="space-y-3 mt-3">
                  <ColorInputPopover label="צבע רקע כרטיסים" value={cardColor} onChange={setCardColor} />
                  <ColorInputPopover label="צבע גבול כרטיסים" value={cardBorderColor} onChange={setCardBorderColor} />
                  <ColorInputPopover label="צבע גבולות כללי" value={borderColor} onChange={setBorderColor} />
                  <ColorInputPopover label="צבע רקע כפתורים" value={buttonBgColor} onChange={setButtonBgColor} />
                </TabsContent>

                <TabsContent value="sidebar" className="space-y-3 mt-3">
                  <ColorInputPopover label="צבע רקע סיידבר" value={sidebarBgColor} onChange={setSidebarBgColor} />
                  <ColorInputPopover label="צבע טקסט סיידבר" value={sidebarTextColor} onChange={setSidebarTextColor} contrastWith={sidebarBgColor} />
                  <ColorInputPopover label="צבע גבול סיידבר" value={sidebarBorderColor} onChange={setSidebarBorderColor} />
                  
                  <Separator className="my-2" />
                  <p className="text-xs text-muted-foreground font-medium">מסגרת סיידבר</p>
                  
                  <div className="space-y-1">
                    <Label className="text-sm">עובי קו מסגרת</Label>
                    <div className="flex gap-2">
                      {[
                        { value: "thin", label: "דק", width: "1px" },
                        { value: "medium", label: "בינוני", width: "2px" },
                        { value: "thick", label: "עבה", width: "4px" },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={sidebarBorderWidth === option.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSidebarBorderWidth(option.value as "thin" | "medium" | "thick")}
                          className="flex-1"
                        >
                          <span className="inline-block w-6 h-3 rounded" style={{ border: `${option.width} solid currentColor` }} />
                          <span className="mr-1 text-xs">{option.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-sm">רדיוס פינות</Label>
                    <div className="flex gap-2">
                      {[
                        { value: "small", label: "קטן", radius: "8px" },
                        { value: "medium", label: "בינוני", radius: "16px" },
                        { value: "large", label: "גדול", radius: "24px" },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={sidebarBorderRadius === option.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSidebarBorderRadius(option.value as "small" | "medium" | "large")}
                          className="flex-1"
                        >
                          <span className="inline-block w-4 h-4 bg-current" style={{ borderRadius: option.radius }} />
                          <span className="mr-1 text-xs">{option.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <Separator className="my-2" />
                  <p className="text-xs text-muted-foreground font-medium">גופן סיידבר</p>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">טקסט מודגש (Bold)</Label>
                    <Button
                      type="button"
                      variant={sidebarFontBold ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSidebarFontBold(!sidebarFontBold)}
                      className="font-bold"
                    >
                      B
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-sm">סוג גופן</Label>
                    <select
                      value={sidebarFontFamily}
                      onChange={(e) => setSidebarFontFamily(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="inherit">ברירת מחדל</option>
                      <option value="'Heebo', sans-serif">Heebo</option>
                      <option value="'Assistant', sans-serif">Assistant</option>
                      <option value="'Rubik', sans-serif">Rubik</option>
                      <option value="'Open Sans', sans-serif">Open Sans</option>
                      <option value="'Frank Ruhl Libre', serif">Frank Ruhl Libre</option>
                      <option value="'David Libre', serif">David Libre</option>
                    </select>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label className="font-medium text-sm">תצוגה מקדימה של האתר</Label>
            <div 
              className="rounded-xl overflow-hidden border-2 shadow-lg"
              style={{ borderColor: borderColor }}
            >
              {/* Preview container */}
              <div className="flex h-[350px]">
                {/* Sidebar Preview */}
                <div 
                  className="w-20 flex flex-col items-center py-3 gap-2 m-1 overflow-hidden"
                  style={{ 
                    backgroundColor: sidebarBgColor,
                    border: `${sidebarBorderWidth === "thin" ? "1px" : sidebarBorderWidth === "medium" ? "2px" : "4px"} solid ${sidebarBorderColor}`,
                    borderRadius: sidebarBorderRadius === "small" ? "8px" : sidebarBorderRadius === "medium" ? "16px" : "24px",
                    fontFamily: sidebarFontFamily,
                    fontWeight: sidebarFontBold ? 'bold' : 'normal'
                  }}
                >
                  {sidebarItems.map((item, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-xl transition-all flex flex-col items-center gap-1 ${index === 0 ? 'shadow-sm' : ''}`}
                      style={{ 
                        backgroundColor: index === 0 ? primaryColor : 'transparent',
                        color: index === 0 ? '#ffffff' : sidebarTextColor
                      }}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-[8px]">{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Main Content Preview */}
                <div 
                  className="flex-1 p-3 space-y-3"
                  style={{ backgroundColor }}
                >
                  <h3 
                    className="text-base font-bold"
                    style={{ color: headingColor }}
                  >
                    כותרת דף
                  </h3>
                  <p 
                    className="text-xs"
                    style={{ color: fontColor }}
                  >
                    טקסט לדוגמה באתר
                  </p>
                  
                  {/* Stats Cards Preview */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "אחוז השלמה", value: "75%", bgColor: "#e8f4f8" },
                      { label: "רצף ימים", value: "5", bgColor: "#e8f8e8" },
                    ].map((stat, idx) => (
                      <div 
                        key={idx}
                        className="rounded-lg p-2"
                        style={{ 
                          backgroundColor: cardColor,
                          border: `2px solid ${cardBorderColor}`
                        }}
                      >
                        <div 
                          className="text-sm font-bold"
                          style={{ color: headingColor }}
                        >
                          {stat.value}
                        </div>
                        <div 
                          className="text-[10px]"
                          style={{ color: fontColor }}
                        >
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Preview */}
                  <div 
                    className="rounded-lg p-3"
                    style={{ 
                      backgroundColor: cardColor,
                      border: `2px solid ${cardBorderColor}`
                    }}
                  >
                    <p 
                      className="text-xs font-medium mb-2"
                      style={{ color: fontColor }}
                    >
                      כרטיס לדוגמה
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                        style={{ 
                          backgroundColor: buttonBgColor,
                          color: buttonTextColor,
                          border: `1px solid ${borderColor}`
                        }}
                      >
                        כפתור
                      </button>
                      <button
                        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                        style={{ 
                          backgroundColor: primaryColor,
                          color: "#ffffff"
                        }}
                      >
                        שמור
                      </button>
                    </div>
                  </div>

                  {/* Accent bar */}
                  <div 
                    className="h-1.5 rounded-full mt-2"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
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