import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, ctx: RouteContext<"/api/uploads/[id]">) {
  const { id } = await ctx.params;
  const upload = await prisma.upload.findUnique({ where: { id }, select: { data: true, contentType: true } });
  if (!upload) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(upload.data), {
    headers: {
      "Content-Type": upload.contentType,
      // Uploads are never edited in place (a new image gets a new id), so
      // browsers and the CDN can keep them forever.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
