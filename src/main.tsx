// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Router from "./router";
import { ConfigProvider } from "antd"; // Import ConfigProvider
import "./index.css";
import "antd/dist/antd.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ConfigProvider
        getPopupContainer={(triggerNode) => triggerNode?.parentElement || document.body} // Attach popup to parent element
      >
        <AuthProvider>
          <BrowserRouter>
            <Router />
          </BrowserRouter>
        </AuthProvider>
      </ConfigProvider>
    </React.StrictMode>
  );
}