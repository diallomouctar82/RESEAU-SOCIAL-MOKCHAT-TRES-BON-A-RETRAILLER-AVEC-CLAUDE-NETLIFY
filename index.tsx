import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { registerPwaServiceWorker } from "./services/pwaService";

registerPwaServiceWorker();

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);

