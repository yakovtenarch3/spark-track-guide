import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, MessageCircle, Star, Loader2 } from "lucide-react";
import { useAIConversations } from "@/hooks/useAIConversations";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SavedConversationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadConversation: (messages: Message[]) => void;
}

const SavedConversationsDialog = ({
  open,
  onOpenChange,
  onLoadConversation,
}: SavedConversationsDialogProps) => {
  const { conversations, isLoading, deleteConversation } = useAIConversations();

  const handleLoad = (messages: Message[]) => {
    onLoadConversation(messages);
    onOpenChange(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation.mutate(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            שיחות שמורות
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>אין שיחות שמורות עדיין</p>
            <p className="text-sm">שמור שיחות עם המאמן AI לצפייה בהמשך</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors group"
                  onClick={() => handleLoad(conv.messages)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{conv.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(conv.created_at), "d בMMM yyyy, HH:mm", { locale: he })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conv.messages.length} הודעות
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      onClick={(e) => handleDelete(e, conv.id)}
                      disabled={deleteConversation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SavedConversationsDialog;
