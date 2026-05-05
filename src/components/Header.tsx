import React from "react";
import { Layout } from "antd";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";
import SiteLogo from "../assets/sitelogo-removebg-preview.png";

const { Header } = Layout;

interface HeaderProps {
  collapsed: boolean;
  toggleCollapse: () => void;
}

const AppHeader: React.FC<HeaderProps> = ({ collapsed, toggleCollapse }) => {
  return (
    <Header className="bg-white flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
          className: "trigger cursor-pointer",
          onClick: toggleCollapse,
        })}
        <span className="text-lg font-semibold">Lycoming Aviation</span>
      </div>
      <div>
        <img src={SiteLogo} alt="siteicon" className="w-14 md:w-30 lg:w-44 mx-auto" />
      </div>
    </Header>
  );
};

export default AppHeader;
