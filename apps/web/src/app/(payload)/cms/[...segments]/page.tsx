import {
  generatePayloadMetadata,
  type PayloadPageProps,
  renderPayloadPage,
} from "../payload-root-page";

export const generateMetadata = generatePayloadMetadata;

export default function PayloadCmsPage(props: PayloadPageProps) {
  return renderPayloadPage(props);
}
