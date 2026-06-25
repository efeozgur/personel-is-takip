import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role === "PENDING") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const step = await prisma.step.findUnique({
      where: { id },
      include: { process: { select: { authorId: true } } },
    });

    if (!step) {
      return NextResponse.json(
        { error: "Adım bulunamadı." },
        { status: 404 }
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      step.process.authorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    const { title, description, order } = await request.json();

    // Başlık yoksa veya boşsa açıklamadan otomatik üret
    const finalTitle = (title && title.trim())
      ? title.trim()
      : (description && description.trim()
          ? description.trim().split("\n")[0].substring(0, 50)
          : `Adım ${order ?? ""}`.trim());

    const updatedStep = await prisma.step.update({
      where: { id },
      data: { title: finalTitle, description, order },
      include: { images: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(updatedStep);
  } catch (error) {
    console.error("Adım güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role === "PENDING") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const step = await prisma.step.findUnique({
      where: { id },
      include: { process: { select: { authorId: true } } },
    });

    if (!step) {
      return NextResponse.json(
        { error: "Adım bulunamadı." },
        { status: 404 }
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      step.process.authorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    await prisma.step.delete({ where: { id } });

    return NextResponse.json({ message: "Adım silindi." });
  } catch (error) {
    console.error("Adım silme hatası:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}