import configPromise from "@payload-config";
import { generatePageMetadata, RootPage } from "@payloadcms/next/views";

import { importMap } from "./importMap";

type PayloadSearchParams = {
  [key: string]: string | string[];
};

export type PayloadPageProps = {
  params: Promise<{
    segments: string[];
  }>;
  searchParams: Promise<PayloadSearchParams>;
};

export function generatePayloadMetadata({
  params,
  searchParams,
}: PayloadPageProps) {
  return generatePageMetadata({
    config: configPromise,
    params,
    searchParams,
  });
}

export function renderPayloadPage({ params, searchParams }: PayloadPageProps) {
  return RootPage({
    config: configPromise,
    importMap,
    params,
    searchParams,
  });
}

