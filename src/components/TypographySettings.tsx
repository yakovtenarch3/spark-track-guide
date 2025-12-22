import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTypography, FONT_OPTIONS } from "@/hooks/useTypography";
import { Type, RotateCcw, ALargeSmall, MoveHorizontal, AlignJustify } from "lucide-react";

export const TypographySettings = () => {
  const { settings, updateSettings, resetSettings, DEFAULT_SETTINGS } = useTypography();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          הגדרות טיפוגרפיה
        </CardTitle>
        <CardDescription>התאם אישית את הגופנים והטקסט</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Font Size */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <ALargeSmall className="h-4 w-4" />
              גודל גופן
            </Label>
            <span className="text-sm text-muted-foreground">{settings.fontSize}%</span>
          </div>
          <Slider
            value={[settings.fontSize]}
            onValueChange={([value]) => updateSettings({ fontSize: value })}
            min={70}
            max={150}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>קטן</span>
            <span>רגיל</span>
            <span>גדול</span>
          </div>
        </div>

        {/* Font Family */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            גופן ראשי
          </Label>
          <Select
            value={settings.fontFamily}
            onValueChange={(value) => updateSettings({ fontFamily: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Heading Font Family */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            גופן כותרות
          </Label>
          <Select
            value={settings.headingFontFamily}
            onValueChange={(value) => updateSettings({ headingFontFamily: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Line Height */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <AlignJustify className="h-4 w-4" />
              גובה שורה
            </Label>
            <span className="text-sm text-muted-foreground">{settings.lineHeight}%</span>
          </div>
          <Slider
            value={[settings.lineHeight]}
            onValueChange={([value]) => updateSettings({ lineHeight: value })}
            min={80}
            max={200}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>צפוף</span>
            <span>רגיל</span>
            <span>מרווח</span>
          </div>
        </div>

        {/* Letter Spacing */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <MoveHorizontal className="h-4 w-4" />
              מרווח אותיות
            </Label>
            <span className="text-sm text-muted-foreground">{settings.letterSpacing > 0 ? '+' : ''}{settings.letterSpacing}</span>
          </div>
          <Slider
            value={[settings.letterSpacing]}
            onValueChange={([value]) => updateSettings({ letterSpacing: value })}
            min={-5}
            max={20}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>צפוף</span>
            <span>רגיל</span>
            <span>מרווח</span>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
          <p className="text-sm text-muted-foreground">תצוגה מקדימה:</p>
          <h3 
            className="text-xl font-bold" 
            style={{ fontFamily: settings.headingFontFamily }}
          >
            כותרת לדוגמה
          </h3>
          <p style={{ fontFamily: settings.fontFamily }}>
            טקסט לדוגמה עם ההגדרות הנוכחיות. זהו טקסט שמדגים את הגופן, הגודל והמרווחים שנבחרו.
          </p>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          onClick={resetSettings}
          className="w-full"
          disabled={JSON.stringify(settings) === JSON.stringify(DEFAULT_SETTINGS)}
        >
          <RotateCcw className="h-4 w-4 ml-2" />
          איפוס להגדרות ברירת מחדל
        </Button>
      </CardContent>
    </Card>
  );
};
