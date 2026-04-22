import React from "react";
import ReactDOM from "react-dom/client";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/react-router";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { dataProvider } from "./refine/dataProvider";
import { AppShell } from "./components/AppShell";
import { TablesPage } from "./pages/TablesPage";
import { EditTablePage } from "./pages/EditTablePage";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Refine
        routerProvider={routerProvider}
        dataProvider={dataProvider}
        resources={[
          {
            name: "tables",
            list: "/tables",
            edit: "/tables/edit/:id",
            meta: {
              label: "Таблицы"
            }
          }
        ]}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: false
        }}
      >
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/tables" replace />} />
            <Route path="/tables" element={<TablesPage />} />
            <Route path="/tables/edit/:id" element={<EditTablePage />} />
          </Routes>
        </AppShell>
      </Refine>
    </BrowserRouter>
  </React.StrictMode>
);
