import { useState, useEffect } from "react";
import { AdvancedPDFEditor } from "@/components/book/AdvancedPDFEditor";
import { PDFHighlighterComponent, type CustomHighlight } from "@/components/book/PDFHighlighter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Pencil, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

const PDFDemo = () => {
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [highlights, setHighlights] = useState<CustomHighlight[]>([]);
  
  // Auto-load the sample PDF
  const samplePDF = "/sample.pdf";

  useEffect(() => {
    // Check if PDF exists
    fetch(samplePDF)
      .then(response => {
        if (response.ok) {
          setPdfLoaded(true);
          toast.success("✅ PDF טעון בהצלחה!");
        } else {
          toast.error("❌ שגיאה בטעינת PDF");
        }
      })
      .catch(() => {
        toast.error("❌ לא נמצא קובץ PDF");
      });
  }, []);

  const handleAddHighlight = (highlight: CustomHighlight) => {
    setHighlights([...highlights, highlight]);
    toast.success(`✅ הדגשה נוספה - צבע: ${highlight.color}`);
  };

  const handleDeleteHighlight = (id: string) => {
    setHighlights(highlights.filter(h => h.id !== id));
    toast.success("🗑️ הדגשה נמחקה");
  };

  const handleUpdateHighlight = (id: string, updates: Partial<CustomHighlight>) => {
    setHighlights(highlights.map(h => h.id === id ? { ...h, ...updates } : h));
    toast.success("✏️ הדגשה עודכנה");
  };

  const handleSave = (data: any) => {
    console.log("💾 נתונים נשמרו:", data);
    toast.success("💾 השינויים נשמרו!");
  };

  return (
    <div className="container mx-auto py-6 px-4 h-screen flex flex-col" dir="rtl">
      {/* Header with Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="w-8 h-8" />
              בדיקת E2E - עורך PDF מתקדם
            </h1>
            <p className="text-muted-foreground mt-1">
              הדגמה אוטומטית של שתי הטכנולוגיות
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex gap-2">
            {pdfLoaded ? (
              <Badge variant="default" className="gap-2">
                <CheckCircle2 className="w-4 h-4" />
                PDF נטען בהצלחה
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                טוען...
              </Badge>
            )}
          </div>
        </div>

        {/* Instructions */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            הוראות שימוש:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>המערכת טוענת אוטומטית PDF לדוגמה</li>
            <li>עבור בין הטאבים כדי לראות את ההבדלים</li>
            <li>ב<strong>עורך מתקדם</strong>: לחץ "טקסט" או "הדגשה" כדי להוסיף רכיבים</li>
            <li>ב<strong>קורא רגיל</strong>: סמן טקסט כדי להדגיש</li>
          </ul>
        </Card>
      </div>

      {/* Tabs with both editors */}
      {pdfLoaded ? (
        <Tabs defaultValue="advanced" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="advanced" className="gap-2">
              <Pencil className="w-4 h-4" />
              עורך מתקדם ⭐ (BOLD + גופנים)
            </TabsTrigger>
            <TabsTrigger value="basic" className="gap-2">
              <FileText className="w-4 h-4" />
              קורא רגיל (הדגשות בלבד)
            </TabsTrigger>
          </TabsList>

          {/* Advanced Editor Tab */}
          <TabsContent value="advanced" className="flex-1 mt-0">
            <Card className="h-full p-0 overflow-hidden">
              <div className="h-full">
                <AdvancedPDFEditor
                  fileUrl={samplePDF}
                  onSave={handleSave}
                  initialAnnotations={[]}
                />
              </div>
            </Card>
            
            {/* Features list for advanced */}
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                מה שעובד כאן:
              </h3>
              <div className="grid md:grid-cols-2 gap-2 text-sm text-green-800 dark:text-green-200">
                <div>✅ תיבות טקסט חופשיות</div>
                <div>✅ שינוי גופן (David, Miriam, Heebo)</div>
                <div>✅ <strong>בולד</strong>, <em>איטליק</em>, <u>קו תחתון</u></div>
                <div>✅ שינוי גודל וצבע</div>
                <div>✅ הדגשות צבעוניות</div>
                <div>✅ ייצוא כתמונה</div>
              </div>
            </div>
          </TabsContent>

          {/* Basic Highlighter Tab */}
          <TabsContent value="basic" className="flex-1 mt-0">
            <Card className="h-full p-0 overflow-hidden">
              <div className="h-full">
                <PDFHighlighterComponent
                  fileUrl={samplePDF}
                  highlights={highlights}
                  onAddHighlight={handleAddHighlight}
                  onDeleteHighlight={handleDeleteHighlight}
                  onUpdateHighlight={handleUpdateHighlight}
                  className="h-full"
                />
              </div>
            </Card>

            {/* Features list for basic */}
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                מגבלות הקורא הרגיל:
              </h3>
              <div className="grid md:grid-cols-2 gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                <div>✅ הדגשות טקסט</div>
                <div>✅ הוספת הערות</div>
                <div>❌ אין בולד/איטליק</div>
                <div>❌ אין שינוי גופן</div>
                <div>❌ אין טקסט חופשי</div>
                <div>❌ אין עיצוב טיפוגרפי</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
            <div>
              <h2 className="text-xl font-semibold mb-2">טוען PDF...</h2>
              <p className="text-muted-foreground">
                המערכת טוענת את קובץ ה-PDF לדוגמה
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Bottom Info */}
      <div className="mt-4 p-4 bg-muted rounded-lg text-center text-sm">
        <p className="text-muted-foreground">
          💡 <strong>טיפ:</strong> העורך המתקדם מאפשר לך לעשות כל מה שראית ב-VS Code PDF Viewer
          (bold, italic, גופנים) ועוד!
        </p>
      </div>
    </div>
  );
};

export default PDFDemo;
