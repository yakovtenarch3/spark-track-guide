import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { SidebarEdgeTrigger } from "@/components/SidebarEdgeTrigger";
import Index from "./pages/Index";
import Habits from "./pages/Habits";
import WakeUp from "./pages/WakeUp";
import DailyGoals from "./pages/DailyGoals";
import AICoach from "./pages/AICoach";
import Achievements from "./pages/Achievements";
import Archive from "./pages/Archive";
import Settings from "./pages/Settings";
import Install from "./pages/Install";
import BookReaderPage from "./pages/BookReader";
import PDFTestPage from "./pages/PDFTest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <SidebarProvider>
        <div className="min-h-screen flex w-full" dir="rtl">
          <AppSidebar />
          <SidebarEdgeTrigger />
          <div className="flex-1 flex flex-col">
            <TopBar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/habits" element={<Habits />} />
                <Route path="/wake-up" element={<WakeUp />} />
                <Route path="/daily-goals" element={<DailyGoals />} />
                <Route path="/ai-coach" element={<AICoach />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/archive" element={<Archive />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/install" element={<Install />} />
                <Route path="/book" element={<BookReaderPage />} />
                <Route path="/pdf-test" element={<PDFTestPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
