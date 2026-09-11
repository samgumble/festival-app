import "./design/tokens.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { setupServiceWorker } from "./app/sw";
import { captureInstallPrompt } from "./platform/install";
import { splash } from "./platform/splash";

captureInstallPrompt();
setupServiceWorker();
// Backstop: the normal hide happens from TabShell after first paint; this guards a web-layer
// failure that would otherwise leave the launch screen up forever. Web: no-op.
setTimeout(() => void splash.hide(), 4000);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
