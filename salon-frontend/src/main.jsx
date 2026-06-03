import React from "react";

import ReactDOM from "react-dom/client";

import "./index.css";
import "./styles/global.css";

import App from "./App";

import { Provider }
from "react-redux";

import { store }
from "./app/store";

import { LanguageProvider }
from "./i18n/LanguageContext";

/* 🔥 PWA */
import { registerSW }
from "virtual:pwa-register";

/* 🔥 REGISTER SERVICE WORKER */
registerSW({
  immediate: true,
});

ReactDOM.createRoot(
  document.getElementById("root")
).render(

  <Provider store={store}>

    <LanguageProvider>

      <App />

    </LanguageProvider>

  </Provider>
);