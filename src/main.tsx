import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNotificationScheduler } from "./utils/notificationScheduler";

// Initialize notification scheduler
initNotificationScheduler();

createRoot(document.getElementById("root")!).render(<App />);
