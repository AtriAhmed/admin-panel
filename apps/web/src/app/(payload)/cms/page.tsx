import {
  generatePayloadMetadata,
  renderPayloadPage,
} from "./payload-root-page";

const emptyParams = Promise.resolve({ segments: [] });

type PayloadCmsIndexProps = {
  searchParams: Promise<{
    [key: string]: string | string[];
  }>;
};

export function generateMetadata({ searchParams }: PayloadCmsIndexProps) {
  return generatePayloadMetadata({
    params: emptyParams,
    searchParams,
  });
}

export default function PayloadCmsIndexPage({
  searchParams,
}: PayloadCmsIndexProps) {
  return renderPayloadPage({
    params: emptyParams,
    searchParams,
  });
}
