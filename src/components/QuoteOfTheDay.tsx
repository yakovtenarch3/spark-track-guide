import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Play, Pause, Clock } from "lucide-react";
import { getQuoteOfTheDay } from "@/data/motivationalQuotes";
import { useEffect, useState, useRef } from "react";
import { useCustomQuotes } from "@/hooks/useCustomQuotes";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export const QuoteOfTheDay = () => {
  const { quotes } = useCustomQuotes();
  const [quote, setQuote] = useState(getQuoteOfTheDay());
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotateInterval, setRotateInterval] = useState(5); // minutes
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Combine default quotes with custom active quotes
  const getRandomQuote = () => {
    const activeCustomQuotes = quotes.filter(q => q.is_active);
    const allQuotes = [...activeCustomQuotes];
    
    if (allQuotes.length > 0) {
      // Prefer custom quotes if available
      const randomIndex = Math.floor(Math.random() * allQuotes.length);
      return allQuotes[randomIndex];
    }
    
    return getQuoteOfTheDay();
  };

  useEffect(() => {
    // Update quote when custom quotes change
    if (quotes.length > 0) {
      setQuote(getRandomQuote());
    }
  }, [quotes]);

  useEffect(() => {
    // Update quote at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const timer = setTimeout(() => {
      setQuote(getRandomQuote());
      // Set up daily interval
      setInterval(() => {
        setQuote(getRandomQuote());
      }, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);

    return () => clearTimeout(timer);
  }, [quotes]);

  useEffect(() => {
    if (autoRotate) {
      intervalRef.current = setInterval(() => {
        setQuote(getRandomQuote());
      }, rotateInterval * 60 * 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRotate, rotateInterval, quotes]);

  const handleManualRefresh = () => {
    setQuote(getRandomQuote());
    toast.success("ציטוט חדש הוצג! ✨");
  };

  const toggleAutoRotate = () => {
    setAutoRotate(!autoRotate);
    toast.success(
      !autoRotate 
        ? `החלפה אוטומטית הופעלה - כל ${rotateInterval} דקות 🔄` 
        : "החלפה אוטומטית הושבתה ⏸️"
    );
  };

  return (
    <Card className="p-6 royal-card animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-3 rounded-full bg-gradient-to-br from-accent/20 to-primary/10">
          <Sparkles className="w-6 h-6 text-accent" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-accent uppercase tracking-wide">
              ציטוט מעורר השראה
            </h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleManualRefresh}
                className="h-8 w-8 p-0 hover:bg-accent/10 transition-colors"
                title="החלף ציטוט"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={autoRotate ? "default" : "ghost"}
                onClick={toggleAutoRotate}
                className="h-8 w-8 p-0"
                title={autoRotate ? "עצור החלפה אוטומטית" : "הפעל החלפה אוטומטית"}
              >
                {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <blockquote className="text-lg font-medium text-foreground leading-relaxed">
            &quot;{quote.text}&quot;
          </blockquote>
          
          <p className="text-sm text-muted-foreground">— {quote.author}</p>
          
          {autoRotate && (
            <div className="space-y-3 pt-2 border-t border-accent/30">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                <Label htmlFor="interval-slider" className="text-sm font-medium">
                  החלפה כל {rotateInterval} {rotateInterval === 1 ? "דקה" : "דקות"}
                </Label>
                <span className="mr-auto w-2 h-2 rounded-full bg-accent animate-pulse" />
              </div>
              <Slider
                id="interval-slider"
                min={1}
                max={10}
                step={1}
                value={[rotateInterval]}
                onValueChange={(value) => {
                  setRotateInterval(value[0]);
                  toast.success(`זמן ההחלפה עודכן ל-${value[0]} ${value[0] === 1 ? "דקה" : "דקות"} ⏱️`);
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 דקה</span>
                <span>5 דקות</span>
                <span>10 דקות</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
