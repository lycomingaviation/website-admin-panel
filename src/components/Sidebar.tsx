import React, { useState, useEffect } from "react";
import { Layout, Menu, Drawer, Button } from "antd";
import { Link, useLocation } from "react-router-dom";
import { LogoutOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import AppHeader from "../components/Header";
import SiteLogo from "../assets/dashboard.jpg";

import { routes, RouteConfig } from "../routes";
import { getUserDetails } from "../Utils/userUtils";

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const userDetails = getUserDetails();
  void userDetails; // retained for future role-based filtering

  const allowedKeys = [
    "testimonials",
    "event",
    "eventHub",           // parent group
    "eventDetails",       // children of eventHub
    "seminarManagement",
    "checkinDetails",
    "galleryManagement",
    "contactDetails",
    "registerDetails",
  ];

  // Filter top-level routes by allowedKeys
  const filteredRoutes = routes.filter(
    (route) => allowedKeys.includes(route.key) && route.showInSidebar
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleDrawer = () => setIsDrawerVisible(!isDrawerVisible);

  /** Returns the key of the deepest route that matches the current path */
  const getActiveKey = (): string => {
    // Flatten all routes (including children)
    const flatRoutes: RouteConfig[] = [];
    const flatten = (list: RouteConfig[]) => {
      list.forEach((r) => {
        flatRoutes.push(r);
        if (r.children) flatten(r.children);
      });
    };
    flatten(routes);

    const activeRoute = flatRoutes
      .slice()
      .sort((a, b) => b.path.length - a.path.length)
      .find((route) => location.pathname.startsWith(route.path));
    return activeRoute?.key || "";
  };

  /**
   * Returns the keys of SubMenu parents that should be open, so the active
   * child is visible on first load / navigation.
   */
  const getOpenKeys = (): string[] => {
    const activeKey = getActiveKey();
    const openKeys: string[] = [];
    const findParent = (list: RouteConfig[], parentKey?: string) => {
      for (const route of list) {
        if (route.key === activeKey && parentKey) openKeys.push(parentKey);
        if (route.children) findParent(route.children, route.key);
      }
    };
    findParent(routes);
    return openKeys;
  };

  const renderMenuItems = (menuRoutes: RouteConfig[]) =>
    menuRoutes
      .filter((route) => route.showInSidebar)
      .map((route) => {
        if (route.children && route.children.length > 0) {
          return (
            <Menu.SubMenu key={route.key} icon={route.icon} title={route.label}>
              {renderMenuItems(route.children)}
            </Menu.SubMenu>
          );
        }
        return (
          <Menu.Item key={route.key} icon={route.icon}>
            <Link to={route.path}>{route.label}</Link>
          </Menu.Item>
        );
      });

  const renderMenu = (theme: "dark" | "light", onClick?: () => void) => (
    <>
      <Menu
        theme={theme}
        mode="inline"
        selectedKeys={[getActiveKey()]}
        defaultOpenKeys={getOpenKeys()}
        onClick={onClick}
      >
        {renderMenuItems(filteredRoutes)}
      </Menu>
      {!collapsed && (
        <div style={{ position: "absolute", bottom: 16, width: "100%", padding: "0 16px" }}>
          <Button
            className="bg-red-500 !flex items-center justify-center gap-2 btn-color !border-none !rounded-lg"
            type="primary"
            icon={<LogoutOutlined />}
            onClick={logout}
            block
          >
            Logout
          </Button>
        </div>
      )}
    </>
  );

  return (
    <>
      {isMobile ? (
        <>
          <AppHeader collapsed={false} toggleCollapse={toggleDrawer} />
          <Drawer
            title="LYCOMING"
            placement="left"
            closable
            onClose={toggleDrawer}
            open={isDrawerVisible}
            bodyStyle={{ padding: 0, overflow: "hidden" }}
            width={250}
          >
            {renderMenu("light", toggleDrawer)}
          </Drawer>
        </>
      ) : (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={onCollapse}
          breakpoint="lg"
          collapsedWidth="0"
          theme="light"
          width={250}
          style={{
            position: "fixed",
            height: "100vh",
            borderRight: "1px solid #d9d9d9",
            boxShadow: "2px 0 5px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div className="logo mt-5 mb-5">
            <img src={SiteLogo} alt="siteicon" className="w-30 md:w-40 lg:w-49 mx-auto" />
          </div>
          {renderMenu("light")}
        </Sider>
      )}
    </>
  );
};

export default Sidebar;