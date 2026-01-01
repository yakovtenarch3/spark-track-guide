import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, EyeOff, Trash2, Plus, Key, Lock } from "lucide-react";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  serviceName: string;
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
  const [newServiceName, setNewServiceName] = useState("");
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
    setNewServiceName("");
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
    if (!newServiceName.trim() || !newKeyValue.trim()) {
      toast.error("יש למלא את כל השדות");
      return;
    }

    const newKey: ApiKey = {
      id: crypto.randomUUID(),
      serviceName: newServiceName.trim(),
      keyValue: newKeyValue.trim(),
      createdAt: new Date().toISOString(),
    };

    saveApiKeys([...apiKeys, newKey]);
    setNewServiceName("");
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
                    <Label>שם השירות</Label>
                    <Input
                      placeholder="לדוגמה: OpenAI, Stripe..."
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                    />
                  </div>
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
                        setNewServiceName("");
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
                            {apiKey.serviceName}
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
