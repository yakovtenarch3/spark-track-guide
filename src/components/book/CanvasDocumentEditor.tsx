import { useEffect, useRef, useState } from "react";
import Editor from "@hufe921/canvas-editor";
import docxPlugin from "@hufe921/canvas-editor-plugin-docx";
import { Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface CanvasDocumentEditorProps {
  fileUrl: string;
}

const extractBooksStoragePath = (fileUrl: string) => {
  const m = fileUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/books\/(.+)$/);
  if (m?.[1]) return decodeURIComponent(m[1]);
  const m2 = fileUrl.match(/\/object\/(?:public|sign)\/books\/(.+)$/);
  if (m2?.[1]) return decodeURIComponent(m2[1]);
  const parts = fileUrl.split("/");
  const lastTwo = parts.slice(-2).join("/");
  return lastTwo.includes("/") ? lastTwo : null;
};

const loadArrayBuffer = async (fileUrl: string) => {
  try {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.arrayBuffer();
  } catch (e) {
    const storagePath = extractBooksStoragePath(fileUrl);
    if (!storagePath) throw e;
    const { data, error } = await supabase.storage.from("books").download(storagePath);
    if (error) throw error;
    return await data.arrayBuffer();
  }
};

export function CanvasDocumentEditor({ fileUrl }: CanvasDocumentEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Initialize the editor
    const editor = new Editor(containerRef.current, {
      main: [], // Start with empty content
    });
    editorRef.current = editor;

    // 2. Register the DOCX plugin
    editor.use(docxPlugin);

    const loadDocx = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 3. Fetch the DOCX file
        const arrayBuffer = await loadArrayBuffer(fileUrl);

        // 4. Import into the editor using the plugin's method
        // @ts-ignore - TypeScript might not pick up the module augmentation immediately
        editor.command.executeImportDocx({
          arrayBuffer: arrayBuffer,
        });

      } catch (err) {
        console.error("Error loading DOCX:", err);
        setError(err instanceof Error ? err.message : "Failed to load document");
      } finally {
        setIsLoading(false);
      }
    };

    if (fileUrl) {
      loadDocx();
    }

    return () => {
      editor.destroy();
    };
  }, [fileUrl]);

  return (
    <div className="relative w-full h-full bg-[#f4f6f9] overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">טוען עורך מתקדם...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4 z-20">
          <Card className="p-6 max-w-md w-full bg-destructive/10 border-destructive text-destructive">
            <div className="flex items-center gap-2 mb-2 font-bold">
              <AlertCircle className="w-5 h-5" />
              שגיאה בטעינת הקובץ
            </div>
            <p className="text-sm opacity-90">{error}</p>
          </Card>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
