import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import "./docxWordView.css";
import { renderAsync } from "docx-preview";
import { supabase } from "@/integrations/supabase/client";

const extractBooksStoragePath = (fileUrl: string) => {
  // Matches both public and signed URLs.
  // Example: .../storage/v1/object/public/books/user-books/123.docx
  const m = fileUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/books\/(.+)$/);
  if (m?.[1]) return decodeURIComponent(m[1]);

  const m2 = fileUrl.match(/\/object\/(?:public|sign)\/books\/(.+)$/);
  if (m2?.[1]) return decodeURIComponent(m2[1]);

  // Fallback: old heuristic (may fail for deeper paths)
  const parts = fileUrl.split("/");
  const lastTwo = parts.slice(-2).join("/");
  return lastTwo.includes("/") ? lastTwo : null;
};

const loadArrayBuffer = async (fileUrl: string) => {
  console.log("DocxWordView: Fetching URL:", fileUrl);
  // Prefer direct fetch (works for truly public URLs).
  try {
    const res = await fetch(fileUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return await res.arrayBuffer();
  } catch (e) {
    console.warn("DocxWordView: Direct fetch failed, trying Supabase download...", e);
    // Fallback: use Supabase Storage download (works for private buckets when user is authed).
    const storagePath = extractBooksStoragePath(fileUrl);
    if (!storagePath) throw e;

    const { data, error } = await supabase.storage.from("books").download(storagePath);
    if (error) throw error;
    return await data.arrayBuffer();
  }
};

export function DocxWordView({ fileUrl }: { fileUrl: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setErrorText(null);
      try {
        const arrayBuffer = await loadArrayBuffer(fileUrl);
        console.log("DocxWordView: Loaded buffer size:", arrayBuffer.byteLength);

        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";

        await renderAsync(arrayBuffer, container, undefined, {
          className: "docx",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          useBase64URL: true,
        });
      } catch (e) {
        console.error("DocxWordView render error:", e);
        const msg = e instanceof Error ? e.message : "Unknown error";
        setErrorText(msg);
        toast.error("שגיאה בטעינת תצוגת Word");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  return (
    <div className="h-full overflow-auto p-4 bg-muted/30 relative min-h-[400px]">
      <div ref={containerRef} className="w-full" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span>טוען תצוגת Word...</span>
          </div>
        </div>
      )}

      {errorText && (
        <div className="absolute inset-0 flex items-center justify-center p-4 z-20">
          <Card className="p-6 max-w-md w-full bg-destructive/10 border-destructive text-destructive">
            <div className="flex items-center gap-2 mb-2 font-bold">
              <AlertCircle className="w-5 h-5" />
              שגיאה בטעינת הקובץ
            </div>
            <p className="text-sm opacity-90">{errorText}</p>
            <p className="text-xs mt-2 opacity-70">נסה לעבור למצב עריכה.</p>
          </Card>
        </div>
      )}
    </div>
  );
}

