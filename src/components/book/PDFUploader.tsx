import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PDFUploaderProps {
  onUploadComplete: (fileUrl: string, fileName: string) => void;
}

const SUPPORTED_EXTENSIONS = new Set(["pdf", "docx", "txt", "html", "htm"]);

const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/html",
]);

const isSupportedBookFile = (file: File) => {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !SUPPORTED_EXTENSIONS.has(ext)) return false;
  // Some environments may return empty/unknown MIME type; fall back to extension check.
  if (!file.type) return true;
  return SUPPORTED_MIME_TYPES.has(file.type);
};

const getUploadHelpText = () => "PDF / Word (DOCX) / TXT / HTML";

export const PDFUploader = ({ onUploadComplete }: PDFUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && isSupportedBookFile(file)) {
      setSelectedFile(file);
    } else {
      toast.error(`נא להעלות קובץ נתמך בלבד (${getUploadHelpText()})`);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isSupportedBookFile(file)) {
      setSelectedFile(file);
    } else if (file) {
      toast.error(`נא להעלות קובץ נתמך בלבד (${getUploadHelpText()})`);
    }
  }, []);

  const uploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `user-books/${fileName}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.storage
        .from('books')
        .upload(filePath, selectedFile);

      clearInterval(progressInterval);

      if (error) throw error;

      setUploadProgress(100);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('books')
        .getPublicUrl(filePath);

      toast.success("הקובץ הועלה בהצלחה!");
      onUploadComplete(urlData.publicUrl, selectedFile.name);
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("שגיאה בהעלאת הקובץ");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="p-6 royal-card">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          <h3 className="font-medium">העלאת ספר</h3>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
        >
          {selectedFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div className="text-right">
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedFile(null)}
                disabled={isUploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-2">
                גרור קובץ לכאן או לחץ לבחירה ({getUploadHelpText()})
              </p>
              <Input
                type="file"
                accept=".pdf,.docx,.txt,.html,.htm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/html"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload">
                <Button variant="outline" asChild>
                  <span>בחר קובץ</span>
                </Button>
              </label>
            </>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              מעלה... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Upload Button */}
        {selectedFile && !isUploading && (
          <Button onClick={uploadFile} className="w-full gap-2">
            <Upload className="w-4 h-4" />
            העלה ספר
          </Button>
        )}
      </div>
    </Card>
  );
};
