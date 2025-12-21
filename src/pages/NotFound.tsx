import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" dir="rtl">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-xl text-muted-foreground">אופס! הדף לא נמצא</p>
        <Button asChild>
          <Link to="/" className="gap-2">
            <Home className="w-4 h-4" />
            חזרה לדף הבית
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
