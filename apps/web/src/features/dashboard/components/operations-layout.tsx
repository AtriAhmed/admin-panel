import type { ReactNode } from "react";

export function OperationsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pb-10 pt-4">
      {children}
    </main>
  );
}
