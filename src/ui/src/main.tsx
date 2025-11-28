import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/fantasy-enhancements.css";

// Set default theme to dark if no theme is set
if (!document.documentElement.classList.contains("light") && !document.documentElement.classList.contains("dark")) {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
