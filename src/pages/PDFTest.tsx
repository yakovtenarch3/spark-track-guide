import { useEffect, useMemo, useState } from "react";
import { PDFHighlighterComponent, type CustomHighlight } from "@/components/book/PDFHighlighter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PDF_TEST_URL = "/e2e-sample.pdf";

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

const PDFTestPage = () => {
  const [highlights, setHighlights] = useState<CustomHighlight[]>([]);
  const [status, setStatus] = useState<"loading" | "loaded" | "idle">("idle");
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const canonical = useMemo(() => `${window.location.origin}/pdf-test`, []);

  useEffect(() => {
    document.title = "PDF Test | Book Reader";
    ensureMeta(
      "description",
      "PDF test page to verify PDF loading and highlighting in the book reader."
    );
    ensureCanonical(canonical);
  }, [canonical]);

  return (
    <main className="w-full py-6 px-4" dir="rtl">
      <header className="max-w-6xl mx-auto mb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">בדיקת טעינת PDF (E2E)</h1>
          <Badge variant={status === "loaded" ? "default" : "secondary"}>
            {status === "loaded"
              ? `נטען בהצלחה${totalPages ? ` · ${totalPages} עמודים` : ""}`
              : status === "loading"
                ? "טוען..."
                : "מוכן"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          הדף הזה טוען PDF לדוגמה מהאפליקציה כדי לוודא שגרסת ה־Worker תואמת לגרסת
          ה־API.
        </p>
      </header>

      <section className="max-w-6xl mx-auto">
        <Card className="h-[calc(100vh-220px)] min-h-[520px] overflow-hidden">
          <PDFHighlighterComponent
            fileUrl={PDF_TEST_URL}
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
            onDocumentLoaded={(pages) => {
              setStatus("loaded");
              setTotalPages(pages);
            }}
            className="h-full"
          />
        </Card>
      </section>

      {/* Hidden: let the loader set status via beforeLoad visually */}
      <div className="sr-only" aria-live="polite">
        {status}
      </div>
    </main>
  );
};

export default PDFTestPage;
