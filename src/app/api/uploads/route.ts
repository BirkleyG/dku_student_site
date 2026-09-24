import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_IMAGE_TYPES,
  MAX_DOCUMENT_BYTES,
  MAX_UPLOAD_BYTES,
  UPLOAD_URL_PREFIX,
} from "@/lib/uploads";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to upload files." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Log in to upload files." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file attached." }, { status: 400 });
  }

  const kind = form?.get("kind") === "document" ? "document" : "image";
  const allowedTypes: readonly string[] = kind === "document" ? ALLOWED_DOCUMENT_TYPES : ALLOWED_IMAGE_TYPES;
  const maxBytes = kind === "document" ? MAX_DOCUMENT_BYTES : MAX_UPLOAD_BYTES;

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      {
        error:
          kind === "document"
            ? "That file type isn't supported. Try a PDF, Word, PowerPoint, or plain text file."
            : "Posters have to be a JPG, PNG, WebP, or GIF.",
      },
      { status: 415 },
    );
  }
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `That file is too big. Try one under ${Math.floor(maxBytes / (1024 * 1024))}MB.` },
      { status: 413 },
    );
  }

  const upload = await prisma.upload.create({
    data: {
      data: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
      size: file.size,
      uploaderId: user.id,
    },
    select: { id: true },
  });

  return NextResponse.json({ url: `${UPLOAD_URL_PREFIX}${upload.id}` }, { status: 201 });
}
