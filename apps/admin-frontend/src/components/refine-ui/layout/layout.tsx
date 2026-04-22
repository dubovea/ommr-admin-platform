import type { PropsWithChildren } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr] bg-background">
      <Sidebar />
      <main className="min-w-0">
        <Header />
        <section className="p-7">{children}</section>
      </main>
    </div>
  );
}
