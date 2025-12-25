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
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

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
  // Advanced properties
  borderWidth?: number;
  borderRadius?: number;
  shadowIntensity?: number;
  fontWeight?: number;
}

interface CustomThemeDialogProps {
  onSaveTheme: (name: string, colors: ExtendedThemeColors) => void;
  editMode?: boolean;
  existingTheme?: {
    name: string;
    label: string;
    colors: any;
  };
  onClose?: () => void;
}

export const CustomThemeDialog = ({
  onSaveTheme,
  editMode = false,
  existingTheme,
  onClose,
}: CustomThemeDialogProps) => {
  const [open, setOpen] = useState(editMode);
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

  // Advanced settings
  const [borderWidth, setBorderWidth] = useState(1);
  const [borderRadius, setBorderRadius] = useState(8);
  const [shadowIntensity, setShadowIntensity] = useState(20);
  const [fontWeight, setFontWeight] = useState(400);

  useEffect(() => {
    if (editMode && existingTheme) {
      setOpen(true);
      setThemeName(existingTheme.label);
      // Load existing colors...
      if (existingTheme.colors.borderWidth !== undefined) {
        setBorderWidth(existingTheme.colors.borderWidth);
      }
      if (existingTheme.colors.borderRadius !== undefined) {
        setBorderRadius(existingTheme.colors.borderRadius);
      }
      if (existingTheme.colors.shadowIntensity !== undefined) {
        setShadowIntensity(existingTheme.colors.shadowIntensity);
      }
      if (existingTheme.colors.fontWeight !== undefined) {
        setFontWeight(existingTheme.colors.fontWeight);
      }
    }
  }, [editMode, existingTheme]);

  // Helper function to convert hex to HSL
  const hexToHSL = (hex: string): string => {
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16) / 255;
      g = parseInt(hex.slice(3, 5), 16) / 255;
      b = parseInt(hex.slice(5, 7), 16) / 255;
    }

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
      sidebarBackground: hexToHSL(sidebarBgColor),
      sidebarForeground: hexToHSL(sidebarTextColor),
      sidebarBorder: hexToHSL(sidebarBorderColor),
      borderWidth,
      borderRadius,
      shadowIntensity,
      fontWeight,
    };

    onSaveTheme(
      existingTheme?.name || themeName.toLowerCase().replace(/\s+/g, "-"),
      colors
    );

    if (!editMode) {
      setOpen(false);
      resetForm();
    } else if (onClose) {
      onClose();
    }
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
    setBorderWidth(1);
    setBorderRadius(8);
    setShadowIntensity(20);
    setFontWeight(400);
  };

  const ColorInput = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 h-10 p-1 cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (!o && editMode && onClose) onClose();
    }}>
      {!editMode && (
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            צור ערכת נושא חדשה
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {editMode ? (
              <>
                <Edit className="w-5 h-5 inline mr-2" />
                עריכת ערכת נושא
              </>
            ) : (
              "צור ערכת נושא מותאמת אישית"
            )}
          </DialogTitle>
          <DialogDescription>
            התאם אישית צבעים, עיצוב ומראה לפי טעמך
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>שם ערכת הנושא</Label>
              <Input
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="לדוגמה: ערכת הזהב שלי"
              />
            </div>

            <Tabs defaultValue="colors" dir="rtl">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="colors">צבעים בסיסיים</TabsTrigger>
                <TabsTrigger value="advanced">מתקדם</TabsTrigger>
                <TabsTrigger value="design">עיצוב</TabsTrigger>
              </TabsList>

              <TabsContent value="colors" className="space-y-4 mt-4">
                <ColorInput
                  label="צבע רקע"
                  value={backgroundColor}
                  onChange={setBackgroundColor}
                />
                <ColorInput
                  label="צבע ראשי"
                  value={primaryColor}
                  onChange={setPrimaryColor}
                />
                <ColorInput
                  label="צבע משני"
                  value={secondaryColor}
                  onChange={setSecondaryColor}
                />
                <ColorInput
                  label="צבע כרטיסים"
                  value={cardColor}
                  onChange={setCardColor}
                />
                <ColorInput
                  label="צבע גבול כרטיסים"
                  value={cardBorderColor}
                  onChange={setCardBorderColor}
                />
                <ColorInput label="צבע טקסט" value={fontColor} onChange={setFontColor} />
                <ColorInput
                  label="צבע כותרות"
                  value={headingColor}
                  onChange={setHeadingColor}
                />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-4">
                <ColorInput label="צבע הדגשה" value={accentColor} onChange={setAccentColor} />
                <ColorInput
                  label="רקע כפתורים"
                  value={buttonBgColor}
                  onChange={setButtonBgColor}
                />
                <ColorInput
                  label="טקסט כפתורים"
                  value={buttonTextColor}
                  onChange={setButtonTextColor}
                />
                <Separator />
                <h3 className="font-bold">סיידבר</h3>
                <ColorInput
                  label="רקע סיידבר"
                  value={sidebarBgColor}
                  onChange={setSidebarBgColor}
                />
                <ColorInput
                  label="טקסט סיידבר"
                  value={sidebarTextColor}
                  onChange={setSidebarTextColor}
                />
                <ColorInput
                  label="גבול סיידבר"
                  value={sidebarBorderColor}
                  onChange={setSidebarBorderColor}
                />
              </TabsContent>

              <TabsContent value="design" className="space-y-6 mt-4">
                <div className="space-y-3">
                  <Label>עובי מסגרת: {borderWidth}px</Label>
                  <Slider
                    value={[borderWidth]}
                    onValueChange={([v]) => setBorderWidth(v)}
                    min={0}
                    max={10}
                    step={1}
                  />
                </div>

                <div className="space-y-3">
                  <Label>רדיוס פינות: {borderRadius}px</Label>
                  <Slider
                    value={[borderRadius]}
                    onValueChange={([v]) => setBorderRadius(v)}
                    min={0}
                    max={50}
                    step={2}
                  />
                </div>

                <div className="space-y-3">
                  <Label>עוצמת צל: {shadowIntensity}%</Label>
                  <Slider
                    value={[shadowIntensity]}
                    onValueChange={([v]) => setShadowIntensity(v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-3">
                  <Label>משקל גופן</Label>
                  <Select
                    value={String(fontWeight)}
                    onValueChange={(v) => setFontWeight(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">דק (300)</SelectItem>
                      <SelectItem value="400">רגיל (400)</SelectItem>
                      <SelectItem value="500">בינוני (500)</SelectItem>
                      <SelectItem value="600">מודגש (600)</SelectItem>
                      <SelectItem value="700">עבה (700)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setOpen(false);
            if (editMode && onClose) onClose();
          }}>
            ביטול
          </Button>
          <Button onClick={handleSave}>
            {editMode ? "עדכן" : "שמור"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
