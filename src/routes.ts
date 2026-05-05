import React from "react";
import {
  DashboardOutlined,
  ReadOutlined,
  CalendarOutlined,
  PictureOutlined,
  ContactsOutlined,
  UserAddOutlined,
  UnorderedListOutlined,
  FormOutlined,
  CheckSquareOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CompanyManagement from "./pages/TestimonalManagement";
import EventManagement from "./pages/EventManagement";
import GalleryManagement from "./pages/GalleryManagement";
import ContactManagement from "./pages/ContactManagement";
import RegisterManagement from "./pages/RegisterManagement";
import EventDetailsManagement from "./pages/EventDetailsManagement";
import EventCheckinManagement from "./pages/EventCheckinManagement";
import SeminarManagement from "./pages/SeminarManagement";

export interface RouteConfig {
  children?: RouteConfig[];
  key: string;
  path: string;
  element?: React.ReactNode;
  label?: string;
  icon?: React.ReactNode;
  protected?: boolean;
  showInSidebar?: boolean;
}

export const routes: RouteConfig[] = [
  {
    key: "login",
    path: "/",
    element: React.createElement(Login),
    protected: false,
    showInSidebar: false,
  },
  {
    key: "login",
    path: "/login",
    element: React.createElement(Login),
    protected: false,
    showInSidebar: false,
  },
  {
    key: "dashboard",
    path: "/dashboard",
    element: React.createElement(Dashboard),
    label: "Dashboard",
    icon: React.createElement(DashboardOutlined),
    protected: true,
    showInSidebar: true,
  },
  {
    key: "testimonials",
    element: React.createElement(CompanyManagement),
    path: "/testimonials",
    label: "Testimonials",
    icon: React.createElement(ReadOutlined),
    protected: true,
    showInSidebar: true,
  },
  {
    key: "event",
    element: React.createElement(EventManagement),
    icon: React.createElement(CalendarOutlined),
    path: "/event",
    label: "Event Management",
    protected: true,
    showInSidebar: true,
  },
  // ── Event Hub group ─────────────────────────────────────
  {
    key: "eventHub",
    path: "/eventHub",                    // no page; used only as SubMenu parent
    element: undefined,
    label: "Event Hub",
    icon: React.createElement(ScheduleOutlined),
    protected: true,
    showInSidebar: true,
    children: [
      {
        key: "eventDetails",
        element: React.createElement(EventDetailsManagement),
        icon: React.createElement(UnorderedListOutlined),
        path: "/eventDetails",
        label: "Event Details",
        protected: true,
        showInSidebar: true,
      },
      {
        key: "seminarManagement",
        element: React.createElement(SeminarManagement),
        icon: React.createElement(FormOutlined),
        path: "/seminarManagement",
        label: "Event Registrations",
        protected: true,
        showInSidebar: true,
      },
      {
        key: "checkinDetails",
        element: React.createElement(EventCheckinManagement),
        icon: React.createElement(CheckSquareOutlined),
        path: "/checkinDetails",
        label: "Event Check-in",
        protected: true,
        showInSidebar: true,
      },
    ],
  },
  // ────────────────────────────────────────────────────────
  {
    key: "galleryManagement",
    element: React.createElement(GalleryManagement),
    path: "/galleryManagement",
    label: "Gallery Management",
    icon: React.createElement(PictureOutlined),
    protected: true,
    showInSidebar: true,
  },
  {
    key: "contactDetails",
    element: React.createElement(ContactManagement),
    path: "/contactDetails",
    label: "Contact Details",
    icon: React.createElement(ContactsOutlined),
    protected: true,
    showInSidebar: true,
  },
  {
    key: "registerDetails",
    element: React.createElement(RegisterManagement),
    path: "/registerDetails",
    label: "Register Details",
    icon: React.createElement(UserAddOutlined),
    protected: true,
    showInSidebar: true,
  },
];
