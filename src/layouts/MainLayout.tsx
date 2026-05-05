import React, { useEffect, useState } from "react";
import { Layout } from "antd";
import Sidebar from "../components/Sidebar";

const { Content } = Layout;

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024); // Match Sidebar's breakpoint

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Layout style={{ minHeight: "100vh" }}> {/* Ensure full viewport height */}
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 0 : 250, // No margin on mobile, adjust for desktop
          transition: "margin-left 0.2s", // Smooth collapse transition
          backgroundColor: "#f0f2f5",
          overflow: "hidden", // Prevent outer layout from scrolling
        }}
      >
        <Content
          style={{
            padding: "10px 24px",
            background: "#fff",
            minHeight: "calc(100vh - 48px)", // Full height minus padding
            overflowY: "auto", // Scroll content only
            boxSizing: "border-box",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;