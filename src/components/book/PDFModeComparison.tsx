import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Pencil, 
  Info, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface PDFModeComparisonProps {
  onModeSelect: (mode: "basic" | "advanced") => void;
  currentMode?: "basic" | "advanced";
}

export const PDFModeComparison = ({ 
  onModeSelect, 
  currentMode = "basic" 
}: PDFModeComparisonProps) => {
  const [selectedMode, setSelectedMode] = useState<"basic" | "advanced">(currentMode);

  const handleModeChange = (mode: "basic" | "advanced") => {
    setSelectedMode(mode);
    onModeSelect(mode);
  };

  const features = [
    {
      name: "הדגשות טקסט",
      basic: true,
      advanced: true,
    },
    {
      name: "הוספת הערות",
      basic: true,
      advanced: true,
    },
    {
      name: "מחיקה ועריכה",
      basic: true,
      advanced: true,
    },
    {
      name: "תיבות טקסט חופשיות",
      basic: false,
      advanced: true,
    },
    {
      name: "שינוי גופן",
      basic: false,
      advanced: true,
    },
    {
      name: "Bold/Italic/Underline",
      basic: false,
      advanced: true,
    },
    {
      name: "שינוי צבע וגודל טקסט",
      basic: false,
      advanced: true,
    },
    {
      name: "גופנים עבריים (דוד, מרים, נרקיסים)",
      basic: false,
      advanced: true,
    },
    {
      name: "ייצוא כתמונה",
      basic: false,
      advanced: true,
    },
  ];

  return (
    <Card className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">בחר מצב עריכת PDF</h2>
        <p className="text-muted-foreground">
          השווה בין שתי הטכנולוגיות ובחר את המתאימה לך
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Basic Mode */}
        <Card 
          className={`p-4 cursor-pointer transition-all ${
            selectedMode === "basic" 
              ? "border-2 border-primary shadow-lg" 
              : "border hover:border-primary/50"
          }`}
          onClick={() => handleModeChange("basic")}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold">קורא רגיל</h3>
            </div>
            {selectedMode === "basic" && (
              <Badge variant="default">נבחר</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            הדגשות והערות בסיסיות - פשוט ומהיר
          </p>
          <div className="flex items-center gap-2">
            <Switch 
              checked={selectedMode === "basic"}
              onCheckedChange={() => handleModeChange("basic")}
            />
            <Label className="text-sm">בחר מצב זה</Label>
          </div>
        </Card>

        {/* Advanced Mode */}
        <Card 
          className={`p-4 cursor-pointer transition-all ${
            selectedMode === "advanced" 
              ? "border-2 border-primary shadow-lg" 
              : "border hover:border-primary/50"
          }`}
          onClick={() => handleModeChange("advanced")}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Pencil className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-semibold">עורך מתקדם</h3>
            </div>
            {selectedMode === "advanced" && (
              <Badge variant="default">נבחר</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            עריכה מלאה עם שינוי גופן, בולד, וטקסט חופשי
          </p>
          <div className="flex items-center gap-2">
            <Switch 
              checked={selectedMode === "advanced"}
              onCheckedChange={() => handleModeChange("advanced")}
            />
            <Label className="text-sm">בחר מצב זה</Label>
          </div>
        </Card>
      </div>

      {/* Feature Comparison Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted p-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Info className="w-4 h-4" />
            השוואת יכולות
          </h3>
        </div>
        <div className="divide-y">
          {features.map((feature, index) => (
            <div key={index} className="grid grid-cols-3 gap-4 p-3 hover:bg-muted/50">
              <div className="col-span-1 text-sm font-medium">
                {feature.name}
              </div>
              <div className="flex items-center justify-center">
                {feature.basic ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center justify-center">
                {feature.advanced ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 font-semibold text-sm">
          <div></div>
          <div className="text-center">קורא רגיל</div>
          <div className="text-center">עורך מתקדם</div>
        </div>
      </div>

      {/* Recommendation Alert */}
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>המלצה</AlertTitle>
        <AlertDescription>
          {selectedMode === "basic" ? (
            <>
              <strong>קורא רגיל</strong> מתאים למי שצריך רק הדגשות והערות בסיסיות. 
              זה פשוט, מהיר, ונשמר אוטומטית למסד הנתונים.
            </>
          ) : (
            <>
              <strong>עורך מתקדם</strong> מתאים למי שצריך יכולות עריכה מלאות - 
              שינוי גופן, בולד, איטליק, קו תחתון, וטקסט חופשי. 
              מושלם לעבודה עם טקסטים עבריים.
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button onClick={() => onModeSelect(selectedMode)} size="lg" className="gap-2">
          {selectedMode === "basic" ? (
            <>
              <FileText className="w-4 h-4" />
              המשך עם קורא רגיל
            </>
          ) : (
            <>
              <Pencil className="w-4 h-4" />
              המשך עם עורך מתקדם
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
