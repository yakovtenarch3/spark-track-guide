import { useEffect, useMemo, useState, useCallback } from "react";
import { PDFHighlighterComponent, type CustomHighlight } from "@/components/book/PDFHighlighter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Upload,
  FileText,
  Eye,
  RotateCcw,
  Clock,
} from "lucide-react";

// Use a local sample PDF bundled in public folder
const LOCAL_SAMPLE_PDF = "/e2e-sample.pdf";

type StepStatus = "pending" | "running" | "success" | "error";

interface Step {
  id: string;
  label: string;
  status: StepStatus;
  message?: string;
  duration?: number;
}

const ensureMeta = (name: string, content: string) => {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
};

const ensureCanonical = (href: string) => {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
};

const StepIndicator = ({ step }: { step: Step }) => {
  const iconMap: Record<StepStatus, React.ReactNode> = {
    pending: <Clock className="w-4 h-4 text-muted-foreground" />,
    running: <Loader2 className="w-4 h-4 text-primary animate-spin" />,
    success: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    error: <XCircle className="w-4 h-4 text-destructive" />,
  };

  const bgMap: Record<StepStatus, string> = {
    pending: "bg-muted/50",
    running: "bg-primary/10 border-primary/30",
    success: "bg-green-500/10 border-green-500/30",
    error: "bg-destructive/10 border-destructive/30",
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${bgMap[step.status]}`}>
      <div className="mt-0.5">{iconMap[step.status]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm">{step.label}</span>
          {step.duration !== undefined && (
            <Badge variant="outline" className="text-xs">
              {step.duration}ms
            </Badge>
          )}
        </div>
        {step.message && (
          <p
            className={`text-xs mt-1 ${
              step.status === "error" ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {step.message}
          </p>
        )}
      </div>
    </div>
  );
};

const PDFTestPage = () => {
  const [highlights, setHighlights] = useState<CustomHighlight[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const [steps, setSteps] = useState<Step[]>([
    { id: "fetch", label: "שליפת PDF לדוגמה", status: "pending" },
    { id: "upload", label: "העלאה ל־Storage", status: "pending" },
    { id: "url", label: "קבלת URL ציבורי", status: "pending" },
    { id: "load", label: "טעינה ב־PDF Viewer", status: "pending" },
  ]);

  const canonical = useMemo(() => `${window.location.origin}/pdf-test`, []);

  useEffect(() => {
    document.title = "בדיקת PDF E2E | קורא ספרים";
    ensureMeta(
      "description",
      "דף בדיקה אוטומטי לוידוא העלאה וטעינה של PDF באפליקציה."
    );
    ensureCanonical(canonical);
  }, [canonical]);

  const updateStep = useCallback(
    (id: string, updates: Partial<Step>) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const resetTest = useCallback(() => {
    setPdfUrl(null);
    setTotalPages(null);
    setHighlights([]);
    setSteps([
      { id: "fetch", label: "שליפת PDF לדוגמה", status: "pending" },
      { id: "upload", label: "העלאה ל־Storage", status: "pending" },
      { id: "url", label: "קבלת URL ציבורי", status: "pending" },
      { id: "load", label: "טעינה ב־PDF Viewer", status: "pending" },
    ]);
  }, []);

  const runE2ETest = useCallback(async () => {
    resetTest();
    setIsRunning(true);

    try {
      // Step 1: Fetch the local sample PDF
      updateStep("fetch", { status: "running", message: "מוריד את הקובץ..." });
      const fetchStart = performance.now();

      const response = await fetch(LOCAL_SAMPLE_PDF);
      if (!response.ok) {
        throw new Error(`Failed to fetch sample PDF: ${response.status}`);
      }
      const pdfBlob = await response.blob();

      updateStep("fetch", {
        status: "success",
        message: `גודל: ${(pdfBlob.size / 1024).toFixed(1)} KB`,
        duration: Math.round(performance.now() - fetchStart),
      });

      // Step 2: Upload to Supabase Storage
      updateStep("upload", { status: "running", message: "מעלה לאחסון..." });
      const uploadStart = performance.now();

      const fileName = `e2e-test-${Date.now()}.pdf`;
      const filePath = `e2e-tests/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("books")
        .upload(filePath, pdfBlob, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      updateStep("upload", {
        status: "success",
        message: `נתיב: ${filePath}`,
        duration: Math.round(performance.now() - uploadStart),
      });

      // Step 3: Get public URL
      updateStep("url", { status: "running", message: "מייצר URL..." });
      const urlStart = performance.now();

      const { data: urlData } = supabase.storage
        .from("books")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to get public URL");
      }

      updateStep("url", {
        status: "success",
        message: urlData.publicUrl.substring(0, 60) + "...",
        duration: Math.round(performance.now() - urlStart),
      });

      // Step 4: Load in PDF Viewer
      updateStep("load", { status: "running", message: "טוען ב־Viewer..." });
      setPdfUrl(urlData.publicUrl);
      // The onDocumentLoaded callback will complete this step
    } catch (error) {
      const currentRunningStep = steps.find((s) => s.status === "running");
      if (currentRunningStep) {
        updateStep(currentRunningStep.id, {
          status: "error",
          message: error instanceof Error ? error.message : String(error),
        });
      }
      setIsRunning(false);
    }
  }, [resetTest, updateStep, steps]);

  const handleDocumentLoaded = useCallback(
    (pages: number) => {
      setTotalPages(pages);
      updateStep("load", {
        status: "success",
        message: `נטען בהצלחה! ${pages} עמודים`,
      });
      setIsRunning(false);
    },
    [updateStep]
  );

  const overallStatus = useMemo(() => {
    if (steps.some((s) => s.status === "error")) return "error";
    if (steps.every((s) => s.status === "success")) return "success";
    if (steps.some((s) => s.status === "running")) return "running";
    return "pending";
  }, [steps]);

  return (
    <main className="w-full py-6 px-4" dir="rtl">
      <header className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">בדיקת PDF מקצה לקצה (E2E)</h1>
              <p className="text-sm text-muted-foreground">
                העלאה אוטומטית לאחסון + טעינה ב־Viewer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={
                overallStatus === "success"
                  ? "default"
                  : overallStatus === "error"
                    ? "destructive"
                    : "secondary"
              }
              className="gap-1"
            >
              {overallStatus === "success" && <CheckCircle2 className="w-3 h-3" />}
              {overallStatus === "error" && <XCircle className="w-3 h-3" />}
              {overallStatus === "running" && <Loader2 className="w-3 h-3 animate-spin" />}
              {overallStatus === "success"
                ? "הצלחה"
                : overallStatus === "error"
                  ? "שגיאה"
                  : overallStatus === "running"
                    ? "רץ..."
                    : "מוכן"}
            </Badge>

            <Button
              onClick={runE2ETest}
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              הרץ בדיקה
            </Button>

            {overallStatus !== "pending" && (
              <Button variant="outline" onClick={resetTest} disabled={isRunning} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                אפס
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-[300px_1fr] gap-6">
        {/* Steps Panel */}
        <aside>
          <Card className="p-4">
            <h2 className="font-medium mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              שלבי הבדיקה
            </h2>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {steps.map((step) => (
                  <StepIndicator key={step.id} step={step} />
                ))}
              </div>
            </ScrollArea>

            {totalPages !== null && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  📄 סה״כ עמודים: <strong>{totalPages}</strong>
                </p>
              </div>
            )}
          </Card>
        </aside>

        {/* PDF Viewer */}
        <section>
          <Card className="h-[calc(100vh-260px)] min-h-[500px] overflow-hidden">
            {pdfUrl ? (
              <PDFHighlighterComponent
                fileUrl={pdfUrl}
                highlights={highlights}
                onAddHighlight={(h) => setHighlights((prev) => [h, ...prev])}
                onDeleteHighlight={(id) =>
                  setHighlights((prev) => prev.filter((h) => h.id !== id))
                }
                onUpdateHighlight={(id, updates) =>
                  setHighlights((prev) =>
                    prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
                  )
                }
                onDocumentLoaded={handleDocumentLoaded}
                className="h-full"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                <FileText className="w-16 h-16 opacity-30" />
                <p>לחץ על "הרץ בדיקה" כדי להתחיל</p>
              </div>
            )}
          </Card>
        </section>
      </div>

      <div className="sr-only" aria-live="polite">
        {overallStatus}
      </div>
    </main>
  );
};

export default PDFTestPage;
