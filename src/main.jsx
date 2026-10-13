import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { store } from "./redux/store.js";
import AuthInitializer from "./components/AuthInitializer.jsx";

import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AuthInitializer>
          <App />
        </AuthInitializer>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
