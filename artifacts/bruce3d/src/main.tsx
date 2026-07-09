import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Отключаем автовосстановление прокрутки браузером — ScrollToTop управляет сам
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

createRoot(document.getElementById("root")!).render(<App />);
