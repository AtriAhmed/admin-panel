import configPromise from "@payload-config";
import "@payloadcms/next/css";
import {
  handleServerFunctions,
  metadata,
  RootLayout,
} from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";

import { importMap } from "./importMap";

export { metadata };

const serverFunction: ServerFunctionClient = async (args) => {
  "use server";

  return handleServerFunctions({
    ...args,
    config: configPromise,
    importMap,
  });
};

export default function PayloadCmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootLayout
      config={configPromise}
      importMap={importMap}
      serverFunction={serverFunction}
    >
      {children}
    </RootLayout>
  );
}

