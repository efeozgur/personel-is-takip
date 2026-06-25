import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role === "PENDING") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const process = await prisma.process.findUnique({ where: { id } });

    if (!process) {
      return NextResponse.json(
        { error: "İş akışı bulunamadı." },
        { status: 404 }
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      process.authorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    const { title, description, order } = await request.json();

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: "Adım açıklaması zorunludur." },
        { status: 400 }
      );
    }

    // En yüksek sıra numarasını bul
    const lastStep = await prisma.step.findFirst({
      where: { processId: id },
      orderBy: { order: "desc" },
    });

    const stepOrder = order ?? (lastStep ? lastStep.order + 1 : 1);

    // Başlık yoksa açıklamadan otomatik üret (ilk 50 karakter) veya "Adım N"
    const autoTitle = (title && title.trim())
      ? title.trim()
      : (description.trim().split("\n")[0].substring(0, 50) || `Adım ${stepOrder}`);

    const step = await prisma.step.create({
      data: {
        processId: id,
        title: autoTitle,
        description,
        order: stepOrder,
      },
      include: {
        images: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    console.error("Adım oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}