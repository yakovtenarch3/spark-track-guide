import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeSelector } from "@/components/ThemeSelector";
import { QuoteManagement } from "@/components/QuoteManagement";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center flex items-center justify-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          הגדרות
        </h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ערכות נושא</CardTitle>
              <CardDescription>התאם אישית את מראה האפליקציה</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSelector />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>משפטי מוטיבציה</CardTitle>
              <CardDescription>נהל את משפטי המוטיבציה המותאמים אישית שלך</CardDescription>
            </CardHeader>
            <CardContent>
              <QuoteManagement />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
