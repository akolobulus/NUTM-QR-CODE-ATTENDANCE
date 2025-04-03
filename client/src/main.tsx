import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Override default font for headings
document.documentElement.style.setProperty('--font-heading', 'Helvetica Neue, Arial, sans-serif');

createRoot(document.getElementById("root")!).render(<App />);
