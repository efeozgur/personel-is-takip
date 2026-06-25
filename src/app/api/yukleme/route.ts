import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role === "PENDING") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const stepId = formData.get("stepId") as string;

    if (!file || !stepId) {
      return NextResponse.json(
        { error: "Dosya ve adım ID zorunludur." },
        { status: 400 }
      );
    }

    // Sadece resim dosyalarına izin ver
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Sadece resim dosyaları yüklenebilir." },
        { status: 400 }
      );
    }

    // Benzersiz dosya adı oluştur
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${file.name.replace(/\s+/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // Klasör yoksa oluştur
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;

    return NextResponse.json(
      { url: fileUrl, alt: file.name },
      { status: 201 }
    );
  } catch (error) {
    console.error("Dosya yükleme hatası:", error);
    return NextResponse.json(
      { error: "Dosya yüklenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}