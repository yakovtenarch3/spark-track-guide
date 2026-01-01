import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Trash2, Plus, Key, Lock, Mail, Phone, Bot, CreditCard, Cloud, Database, Webhook, Zap, Globe, Server, Shield, Github, Brain, Layers, Code, MessageSquare, Search, MapPin, Video, Music, ShoppingCart, BarChart, FileText } from "lucide-react";
import { toast } from "sonner";

// Predefined services with icons and colors
const PREDEFINED_SERVICES = [
  { id: "resend", name: "Resend", icon: Mail, color: "#000000", description: "שליחת אימיילים" },
  { id: "twilio", name: "Twilio", icon: Phone, color: "#F22F46", description: "SMS ו-WhatsApp" },
  { id: "openai", name: "OpenAI", icon: Bot, color: "#10A37F", description: "GPT ו-AI" },
  { id: "anthropic", name: "Anthropic", icon: Brain, color: "#D4A574", description: "Claude AI" },
  { id: "google", name: "Google APIs", icon: Globe, color: "#4285F4", description: "שירותי גוגל" },
  { id: "aws", name: "AWS", icon: Server, color: "#FF9900", description: "Amazon Web Services" },
  { id: "azure", name: "Azure", icon: Shield, color: "#0078D4", description: "Microsoft Azure" },
  { id: "stripe", name: "Stripe", icon: CreditCard, color: "#635BFF", description: "תשלומים" },
  { id: "supabase", name: "Supabase", icon: Database, color: "#3ECF8E", description: "בסיס נתונים" },
  { id: "cloudinary", name: "Cloudinary", icon: Cloud, color: "#3448C5", description: "תמונות ומדיה" },
  { id: "sendgrid", name: "SendGrid", icon: Mail, color: "#1A82E2", description: "אימיילים" },
  { id: "firebase", name: "Firebase", icon: Database, color: "#FFCA28", description: "Google Cloud" },
  { id: "github", name: "GitHub", icon: Github, color: "#181717", description: "קוד וגרסאות" },
  { id: "vercel", name: "Vercel", icon: Layers, color: "#000000", description: "אירוח ופריסה" },
  { id: "netlify", name: "Netlify", icon: Code, color: "#00C7B7", description: "אירוח ופריסה" },
  { id: "slack", name: "Slack", icon: MessageSquare, color: "#4A154B", description: "הודעות צוות" },
  { id: "discord", name: "Discord", icon: MessageSquare, color: "#5865F2", description: "צ'אט קהילתי" },
  { id: "algolia", name: "Algolia", icon: Search, color: "#5468FF", description: "חיפוש" },
  { id: "mapbox", name: "Mapbox", icon: MapPin, color: "#4264FB", description: "מפות" },
  { id: "googlemaps", name: "Google Maps", icon: MapPin, color: "#34A853", description: "מפות גוגל" },
  { id: "youtube", name: "YouTube API", icon: Video, color: "#FF0000", description: "וידאו" },
  { id: "spotify", name: "Spotify", icon: Music, color: "#1DB954", description: "מוזיקה" },
  { id: "shopify", name: "Shopify", icon: ShoppingCart, color: "#7AB55C", description: "חנות אונליין" },
  { id: "mixpanel", name: "Mixpanel", icon: BarChart, color: "#7856FF", description: "אנליטיקס" },
  { id: "notion", name: "Notion", icon: FileText, color: "#000000", description: "ניהול מסמכים" },
  { id: "webhook", name: "Webhook", icon: Webhook, color: "#FF6B6B", description: "התראות" },
  { id: "zapier", name: "Zapier", icon: Zap, color: "#FF4A00", description: "אוטומציה" },
  { id: "custom", name: "שירות מותאם אישית", icon: Key, color: "#6B7280", description: "" },
];

interface ApiKey {
  id: string;
  serviceName: string;
  serviceId: string;
  keyValue: string;
  createdAt: string;
}

interface ApiKeysManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CORRECT_PIN = "543211";

export function ApiKeysManager({ open, onOpenChange }: ApiKeysManagerProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [selectedService, setSelectedService] = useState("");
  const [customServiceName, setCustomServiceName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Load API keys from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user_api_keys");
    if (stored) {
      try {
        setApiKeys(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse API keys", e);
      }
    }
  }, []);

  // Save API keys to localStorage
  const saveApiKeys = (keys: ApiKey[]) => {
    localStorage.setItem("user_api_keys", JSON.stringify(keys));
    setApiKeys(keys);
  };

  const handlePinSubmit = () => {
    if (pin === CORRECT_PIN) {
      setIsAuthenticated(true);
      setPin("");
      toast.success("גישה אושרה");
    } else {
      toast.error("קוד שגוי");
      setPin("");
    }
  };

  const handleClose = () => {
    setIsAuthenticated(false);
    setPin("");
    setVisibleKeys(new Set());
    setIsAdding(false);
    setSelectedService("");
    setCustomServiceName("");
    setNewKeyValue("");
    onOpenChange(false);
  };

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  const addApiKey = () => {
    if (!selectedService || !newKeyValue.trim()) {
      toast.error("יש לבחור שירות ולהזין מפתח");
      return;
    }

    if (selectedService === "custom" && !customServiceName.trim()) {
      toast.error("יש להזין שם לשירות המותאם אישית");
      return;
    }

    const service = PREDEFINED_SERVICES.find(s => s.id === selectedService);
    const serviceName = selectedService === "custom" ? customServiceName.trim() : service?.name || selectedService;

    const newKey: ApiKey = {
      id: crypto.randomUUID(),
      serviceName: serviceName,
      serviceId: selectedService,
      keyValue: newKeyValue.trim(),
      createdAt: new Date().toISOString(),
    };

    saveApiKeys([...apiKeys, newKey]);
    setSelectedService("");
    setCustomServiceName("");
    setNewKeyValue("");
    setIsAdding(false);
    toast.success("מפתח נוסף בהצלחה");
  };

  const deleteApiKey = (id: string) => {
    const updated = apiKeys.filter((key) => key.id !== id);
    saveApiKeys(updated);
    toast.success("מפתח נמחק");
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return key.slice(0, 4) + "••••••••" + key.slice(-4);
  };

  const getServiceIcon = (serviceId: string) => {
    const service = PREDEFINED_SERVICES.find(s => s.id === serviceId);
    if (service) {
      const Icon = service.icon;
      return <Icon className="h-4 w-4" style={{ color: service.color }} />;
    }
    return <Key className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
        {!isAuthenticated ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                אימות נדרש
              </DialogTitle>
              <DialogDescription>
                הזן את קוד הגישה כדי לצפות במפתחות ה-API
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="pin">קוד גישה</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="הזן קוד..."
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>
              <Button onClick={handlePinSubmit} className="w-full">
                אשר
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                ניהול מפתחות API
              </DialogTitle>
              <DialogDescription>
                כאן תוכל לנהל את כל מפתחות ה-API שלך
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Add new key form */}
              {isAdding ? (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                  <div className="space-y-2">
                    <Label>בחר שירות</Label>
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר שירות..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PREDEFINED_SERVICES.map((service) => {
                          const Icon = service.icon;
                          return (
                            <SelectItem key={service.id} value={service.id}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" style={{ color: service.color }} />
                                <span>{service.name}</span>
                                {service.description && (
                                  <span className="text-muted-foreground text-xs">
                                    ({service.description})
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedService === "custom" && (
                    <div className="space-y-2">
                      <Label>שם השירות</Label>
                      <Input
                        placeholder="הזן שם לשירות..."
                        value={customServiceName}
                        onChange={(e) => setCustomServiceName(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>מפתח API</Label>
                    <Input
                      placeholder="הזן את המפתח..."
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                      type="password"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addApiKey} size="sm">
                      שמור
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAdding(false);
                        setSelectedService("");
                        setCustomServiceName("");
                        setNewKeyValue("");
                      }}
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setIsAdding(true)} className="w-full">
                  <Plus className="h-4 w-4 ml-2" />
                  הוסף מפתח חדש
                </Button>
              )}

              {/* API Keys Table */}
              {apiKeys.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">שירות</TableHead>
                        <TableHead className="text-right">מפתח</TableHead>
                        <TableHead className="text-right">תאריך</TableHead>
                        <TableHead className="text-center w-24">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((apiKey) => (
                        <TableRow key={apiKey.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getServiceIcon(apiKey.serviceId)}
                              {apiKey.serviceName}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {visibleKeys.has(apiKey.id)
                              ? apiKey.keyValue
                              : maskKey(apiKey.keyValue)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(apiKey.createdAt).toLocaleDateString("he-IL")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleKeyVisibility(apiKey.id)}
                                title={visibleKeys.has(apiKey.id) ? "הסתר" : "הצג"}
                              >
                                {visibleKeys.has(apiKey.id) ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteApiKey(apiKey.id)}
                                className="text-destructive hover:text-destructive"
                                title="מחק"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>אין מפתחות API שמורים</p>
                  <p className="text-sm">לחץ על "הוסף מפתח חדש" כדי להתחיל</p>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
