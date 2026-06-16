import { NextResponse } from "next/server";

import { createPayloadCmsPage, getPayloadCmsPages } from "@/lib/cms/payload";
import { CreateCmsPageSchema } from "@/lib/mock/schemas";

export async function GET() {
  try {
    const pages = await getPayloadCmsPages();

    return NextResponse.json(pages);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Could not load Payload CMS pages.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = CreateCmsPageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please complete the content request fields." },
      { status: 400 },
    );
  }

  try {
    const page = await createPayloadCmsPage(parsed.data);

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Could not create the Payload CMS page.",
      },
      { status: 500 },
    );
  }
}
