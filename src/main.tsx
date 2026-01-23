import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Import debug functions for debugging
import "./lib/testHistory";
import "./lib/debugHistory";

createRoot(document.getElementById("root")!).render(<App />);
