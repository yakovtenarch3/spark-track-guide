import { useState } from "react";
import { MozillaPDFViewer } from "@/components/book/MozillaPDFViewer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, BookOpen, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";

const ProPDFViewer = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      setSelectedFile(url);
      setFileName(file.name);
      toast.success(`נטען: ${file.name}`);
    } else {
      toast.error("נא לבחור קובץ PDF");
    }
  };

  // Load sample PDF
  const loadSamplePDF = () => {
    setSelectedFile("/sample.pdf");
    setFileName("שינוי בבעיית הדחיינות.pdf");
    toast.success("PDF לדוגמה נטען");
  };

  return (
    <div className="h-screen flex flex-col" dir="rtl">
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              קורא PDF מקצועי
            </h1>
            <p className="text-sm text-muted-foreground">
              בדיוק כמו VS Code - עם תמיכה מלאה בעברית, בחירת טקסט והדגשות
            </p>
          </div>

          <div className="flex items-center gap-2">
            {fileName && (
              <Badge variant="outline" className="gap-1">
                <FileText className="w-3 h-3" />
                {fileName}
              </Badge>
            )}
            
            <Button variant="outline" onClick={loadSamplePDF}>
              PDF לדוגמה
            </Button>

            <Button asChild className="gap-2">
              <label className="cursor-pointer">
                <Upload className="w-4 h-4" />
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
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {!selectedFile ? (
          <div className="h-full flex items-center justify-center">
            <Card className="p-8 text-center max-w-md">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">בחר קובץ PDF</h2>
              <p className="text-muted-foreground mb-6">
                העלה PDF כדי להתחיל לקרוא, לסמן ולהדגיש
              </p>
              
              <div className="space-y-3">
                <Button asChild className="w-full gap-2">
                  <label className="cursor-pointer">
                    <Upload className="w-4 h-4" />
                    העלה מהמחשב
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </Button>

                <Button variant="outline" className="w-full" onClick={loadSamplePDF}>
                  טען PDF לדוגמה
                </Button>
              </div>

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  ✨ מה אפשר לעשות כאן:
                </h3>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1 text-right">
                  <li>✅ לראות את כל העמודים ברצף</li>
                  <li>✅ לבחור ולסמן טקסט</li>
                  <li>✅ להדגיש ב-6 צבעים שונים</li>
                  <li>✅ לחפש בתוך המסמך</li>
                  <li>✅ לעבור בין עמודים</li>
                  <li>✅ זום פנימה והחוצה</li>
                  <li>✅ להדפיס ולהוריד</li>
                  <li>✅ תמיכה מלאה בעברית!</li>
                </ul>
              </div>
            </Card>
          </div>
        ) : (
          <MozillaPDFViewer
            fileUrl={selectedFile}
            onHighlightAdd={(h) => console.log("New highlight:", h)}
            onHighlightRemove={(id) => console.log("Removed:", id)}
          />
        )}
      </div>
    </div>
  );
};

export default ProPDFViewer;
