import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, Sparkles, RefreshCw, Star, History } from "lucide-react";
import { toast } from "sonner";
import { useAIConversations } from "@/hooks/useAIConversations";
import SavedConversationsDialog from "@/components/SavedConversationsDialog";
interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach-chat`;

const QUICK_PROMPTS = [
  "אני מרגיש שאני דוחה משימות חשובות. איך אני מתחיל?",
  "יש לי קושי להתרכז היום. מה אפשר לעשות?",
  "אני מרגיש חסר מוטיבציה. תעזור לי?",
  "איך בונים הרגל חדש בצורה נכונה?",
];

const AICoach = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [savedDialogOpen, setSavedDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { saveConversation } = useAIConversations();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: messageText.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "שגיאה בשליחת ההודעה");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const updated = [...prev];
                if (updated[updated.length - 1]?.role === "assistant") {
                  updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                }
                return updated;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "שגיאה בצ'אט");
      // Remove empty assistant message if error
      setMessages((prev) => {
        if (prev[prev.length - 1]?.role === "assistant" && prev[prev.length - 1]?.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("השיחה נמחקה");
  };

  const handleSaveConversation = () => {
    if (messages.length < 2) {
      toast.error("השיחה קצרה מדי לשמירה");
      return;
    }
    const firstUserMessage = messages.find((m) => m.role === "user");
    const title = firstUserMessage?.content.slice(0, 50) || "שיחה עם המאמן";
    saveConversation.mutate({ title, messages });
  };

  const handleLoadConversation = (loadedMessages: Message[]) => {
    setMessages(loadedMessages);
    toast.success("השיחה נטענה");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-3 sm:p-4 md:p-6 overflow-x-hidden" dir="rtl">
      <div className="max-w-3xl mx-auto h-[calc(100vh-80px)] sm:h-[calc(100vh-100px)] md:h-[calc(100vh-120px)] flex flex-col w-full">
        {/* Header */}
        <div className="text-center space-y-1 sm:space-y-2 mb-3 sm:mb-4">
          <div className="flex items-center justify-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              מאמן AI אישי
            </h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            עזרה עם מצב רוח, דחיינות, הרגלים ומוטיבציה
          </p>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col glass-card overflow-hidden">
          <CardHeader className="py-2 sm:py-3 px-3 sm:px-4 border-b flex-row items-center justify-between">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              שיחה
            </CardTitle>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Button variant="ghost" size="sm" onClick={() => setSavedDialogOpen(true)} className="h-7 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
                <History className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                <span className="hidden sm:inline">שיחות שמורות</span>
              </Button>
              {messages.length >= 2 && (
                <Button variant="ghost" size="sm" onClick={handleSaveConversation} disabled={saveConversation.isPending} className="h-7 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                  <span className="hidden sm:inline">שמור</span>
                </Button>
              )}
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearChat} className="h-7 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                  <span className="hidden sm:inline">חדש</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <Bot className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium mb-2">היי! אני כאן לעזור 👋</h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-md">
                    אני מאמן AI שמתמחה בהתמודדות עם דחיינות, שיפור מצב הרוח, ובניית הרגלים טובים.
                    ספר לי במה אוכל לעזור?
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {QUICK_PROMPTS.map((prompt, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => sendMessage(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>
                      <div
                        className={`flex-1 p-3 rounded-2xl max-w-[85%] ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted rounded-tl-sm"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {msg.content || (
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              מקליד...
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="כתוב הודעה..."
                  className="resize-none min-h-[44px] max-h-[120px]"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="shrink-0 h-11 w-11"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <SavedConversationsDialog
          open={savedDialogOpen}
          onOpenChange={setSavedDialogOpen}
          onLoadConversation={handleLoadConversation}
        />
      </div>
    </div>
  );
};

export default AICoach;
