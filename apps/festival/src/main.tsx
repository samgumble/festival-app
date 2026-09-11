import "./design/tokens.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { setupServiceWorker } from "./app/sw";
import { captureInstallPrompt } from "./platform/install";

captureInstallPrompt();
setupServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
