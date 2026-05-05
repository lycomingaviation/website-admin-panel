// src/router.tsx
import React from "react";
import { Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import PrivateRoute from "./components/PrivateRoute";
import { routes, RouteConfig } from "../src/routes";

/** Flatten nested routes (children) into a single list for React Router */
const flattenRoutes = (list: RouteConfig[]): RouteConfig[] =>
  list.flatMap((route) =>
    route.children ? [route, ...flattenRoutes(route.children)] : [route]
  );

const Router: React.FC = () => (
  <Routes>
    {flattenRoutes(routes).map(({ path, element, protected: isProtected }) => {
      // Skip group-parent routes that have no element (e.g. eventHub)
      if (!element) return null;
      return (
        <Route
          key={path}
          path={path}
          element={
            isProtected ? (
              <PrivateRoute>
                <MainLayout>{element}</MainLayout>
              </PrivateRoute>
            ) : (
              element
            )
          }
        />
      );
    })}
  </Routes>
);

export default Router;
