import { useEffect, useRef, useState } from "react";
import Editor from "@hufe921/canvas-editor";
import docxPlugin from "@hufe921/canvas-editor-plugin-docx";
import { Loader2 } from "lucide-react";

interface CanvasDocxImporterProps {
  fileUrl: string;
}

export function CanvasDocxImporter({ fileUrl }: CanvasDocxImporterProps) {
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
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();

        // 4. Import into the editor
        // The plugin extends the command interface with executeImportDocx
        // @ts-ignore - The type definition might not be automatically picked up in this context without global declaration
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
    <div className="relative w-full h-[800px] bg-[#f4f6f9] border rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading document...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="text-destructive font-medium">
            Error: {error}
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
