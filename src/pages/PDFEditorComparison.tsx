import { useEffect, useState } from "react";
import { AdvancedPDFEditor } from "@/components/book/AdvancedPDFEditor";
import { PDFHighlighterComponent } from "@/components/book/PDFHighlighter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Pencil, BookOpen } from "lucide-react";
import { toast } from "sonner";

const PDFEditorComparison = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  // Sample PDF URL - replace with your actual PDF
  const samplePDF = "/sample.pdf"; // You can change this to your PDF path

  // Load a built-in sample so the page works even when file upload is blocked.
  useEffect(() => {
    if (!selectedFile) {
      setSelectedFile(samplePDF);
      setFileName("sample.pdf");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setSelectedFile(url);
      setFileName(file.name);
      toast.success(`נטען ${file.name}`);
    } else {
      toast.error("נא לבחור קובץ PDF");
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 h-screen flex flex-col" dir="rtl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="w-8 h-8" />
              קורא ועורך PDF מתקדם
            </h1>
            <p className="text-muted-foreground mt-1">
              השוואה בין שתי טכנולוגיות לסימון/הערות על PDF (לא עריכת הטקסט המקורי של הקובץ)
            </p>
          </div>

          <div>
            <Button asChild className="gap-2">
              <label className="cursor-pointer">
                <BookOpen className="w-4 h-4" />
                העלה PDF
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </Button>
          </div>
        </div>

        {fileName && (
          <Badge variant="outline" className="gap-1">
            <FileText className="w-3 h-3" />
            {fileName}
          </Badge>
        )}
      </div>

      {!selectedFile ? (
        <Card className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">בחר קובץ PDF להתחלה</h2>
              <p className="text-muted-foreground mb-4">
                העלה PDF כדי לראות את ההבדל בין הטכנולוגיות
              </p>
              <Button asChild>
                <label className="cursor-pointer gap-2">
                  <BookOpen className="w-4 h-4" />
                  העלה קובץ
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Tabs defaultValue="basic" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="advanced" className="gap-2">
              <Pencil className="w-4 h-4" />
              עורך מתקדם (Fabric.js)
            </TabsTrigger>
            <TabsTrigger value="basic" className="gap-2">
              <FileText className="w-4 h-4" />
              קורא רגיל (Highlighter)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="advanced" className="flex-1 mt-0">
            <Card className="h-full p-0 overflow-hidden">
              <div className="h-full">
                <AdvancedPDFEditor
                  fileUrl={selectedFile}
                  onSave={(data) => {
                    console.log("Saved annotations:", data);
                    toast.success("ההערות נשמרו בהצלחה");
                  }}
                />
              </div>
            </Card>
            <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Pencil className="w-4 h-4" />
                יכולות העורך המתקדם:
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>✅ הוספת תיבות טקסט חופשיות בכל מיקום</li>
                <li>✅ שינוי גופן/בולד/קו תחתון לטקסט שאתה מוסיף (לא לטקסט המקורי של ה‑PDF)</li>
                <li>✅ שינוי גודל וצבע לטקסט שאתה מוסיף</li>
                <li>✅ הדגשות צבעוניות</li>
                <li>✅ מחיקה ועריכה של כל רכיב</li>
                <li>✅ ייצוא כתמונה</li>
                <li>✅ תמיכה מלאה בעברית ו-RTL</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="basic" className="flex-1 mt-0">
            <Card className="h-full p-0 overflow-hidden">
              <div className="h-full">
                <PDFHighlighterComponent
                  fileUrl={selectedFile}
                  highlights={[]}
                  onAddHighlight={(highlight) => {
                    console.log("Added highlight:", highlight);
                  }}
                  onDeleteHighlight={(id) => {
                    console.log("Deleted highlight:", id);
                  }}
                  onUpdateHighlight={(id, updates) => {
                    console.log("Updated highlight:", id, updates);
                  }}
                  className="h-full"
                />
              </div>
            </Card>
            <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                יכולות הקורא הרגיל:
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>✅ הדגשת טקסט/שורות כשאפשר לבחור טקסט ב‑PDF</li>
                <li>✅ הדגשת אזור (לתמונות/סריקות)</li>
                <li>✅ הוספת הערות להדגשות</li>
                <li>✅ מחיקה ועדכון הדגשות</li>
                <li>❌ לא ניתן לשנות גופן או לעשות בולד</li>
                <li>❌ לא ניתן להוסיף טקסט חופשי</li>
                <li>❌ אין אפשרות לעיצוב טיפוגרפי</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default PDFEditorComparison;
