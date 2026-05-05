// src/App.tsx
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./router";
import { ConfigProvider } from "antd"; // Import ConfigProvider
import "antd/dist/reset.css"; // Ant Design CSS Reset
import "./index.css"; // Global Styles
import "../src/styles/global.css";

const App: React.FC = () => {
  return (
    <ConfigProvider
      getPopupContainer={(triggerNode) => triggerNode?.parentElement || document.body}
    >
      <AuthProvider>
        <Router>
          <AppRouter />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;