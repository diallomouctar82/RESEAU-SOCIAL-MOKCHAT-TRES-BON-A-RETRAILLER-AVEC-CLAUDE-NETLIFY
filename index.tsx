import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { registerPwaServiceWorker } from "./services/pwaService";
// Modules exportables : capture de `beforeinstallprompt` dès l'import (le
// navigateur ne l'émet qu'une fois, tôt), puis bascule du manifeste vers celui
// du module demandé par l'URL — AVANT le premier rendu, pour que
// l'installabilité de la page soit évaluée avec le bon manifeste.
import "./services/modules/installPrompt";
import { applyModuleManifest, detectStandaloneModule } from "./services/modules/standaloneMode";

registerPwaServiceWorker();

const standaloneModule = detectStandaloneModule(window.location.pathname, window.location.search);
if (standaloneModule) applyModuleManifest(standaloneModule);

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

