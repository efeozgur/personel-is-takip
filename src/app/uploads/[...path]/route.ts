import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const contentTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const uploadDir = path.resolve(process.cwd(), "public", "uploads");
  const filePath = path.resolve(uploadDir, ...segments);

  if (!filePath.startsWith(`${uploadDir}${path.sep}`)) {
    return new Response("Geçersiz dosya yolu.", { status: 400 });
  }

  try {
    const file = await readFile(filePath);
    const contentType = contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";

    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return new Response("Dosya bulunamadı.", { status: 404 });
  }
}
