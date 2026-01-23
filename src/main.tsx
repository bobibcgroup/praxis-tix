import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Import test function for debugging
import "./lib/testHistory";

createRoot(document.getElementById("root")!).render(<App />);
