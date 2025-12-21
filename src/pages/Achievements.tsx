import { Achievements } from "@/components/Achievements";

export default function AchievementsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">ההישגים שלי</h1>
        <Achievements />
      </div>
    </div>
  );
}
