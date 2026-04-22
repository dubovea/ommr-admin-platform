import { Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerProvider, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { ErrorComponent } from "./components/refine-ui/layout/error-component";
import { Layout } from "./components/refine-ui/layout/layout";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";
import { TableEditPage, TableListPage } from "./pages/table";
import { dataProvider } from "./providers/data";

const enableDevtools = import.meta.env.VITE_REFINE_DEVTOOLS === "true";

function RefineApp() {
  return (
    <Refine
      dataProvider={dataProvider}
      notificationProvider={useNotificationProvider()}
      routerProvider={routerProvider}
      resources={[
        {
          name: "tables",
          list: "/tables",
          create: "/tables/create",
          edit: "/tables/edit/:id",
          show: "/tables/show/:id",
          meta: { canDelete: true, label: "Таблицы" },
        },
        { name: "fields", meta: { label: "Поля" } },
      ]}
      options={{ syncWithLocation: true, warnWhenUnsavedChanges: true }}
    >
      <Routes>
        <Route
          element={
            <Layout>
              <Outlet />
            </Layout>
          }
        >
          <Route index element={<NavigateToResource resource="tables" />} />
          <Route path="/tables">
            <Route index element={<TableListPage />} />
            <Route path="list" element={<TableListPage />} />
            <Route path="edit/:id" element={<TableEditPage />} />
          </Route>
          <Route path="*" element={<ErrorComponent />} />
        </Route>
      </Routes>
      <Toaster />
      <RefineKbar />
      <UnsavedChangesNotifier />
      <DocumentTitleHandler />
    </Refine>
  );
}

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          {enableDevtools ? (
            <DevtoolsProvider>
              <RefineApp />
              <DevtoolsPanel />
            </DevtoolsProvider>
          ) : (
            <RefineApp />
          )}
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}
export default App;
