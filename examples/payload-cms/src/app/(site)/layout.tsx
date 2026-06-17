import type { Metadata } from "next";

import "./styles.css";

export const metadata: Metadata = {
  title: "Proofstack Testimonials",
  description: "A Payload CMS testimonial landing page example.",
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

