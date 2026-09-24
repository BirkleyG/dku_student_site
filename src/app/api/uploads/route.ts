import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, UPLOAD_URL_PREFIX } from "@/lib/uploads";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to upload images." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Log in to upload images." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image attached." }, { status: 400 });
  }
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: "Posters have to be a JPG, PNG, WebP, or GIF." }, { status: 415 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "That image is too big. Try one under 3MB." }, { status: 413 });
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
