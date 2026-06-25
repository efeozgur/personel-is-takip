import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role === "PENDING") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  try {
    const { stepId, url, alt, order } = await request.json();

    if (!stepId || !url) {
      return NextResponse.json(
        { error: "Adım ID ve URL zorunludur." },
        { status: 400 }
      );
    }

    const image = await prisma.image.create({
      data: {
        stepId,
        url,
        alt,
        order: order ?? 0,
        userId: session.user.id,
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("Görsel kaydetme hatası:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session || session.user.role === "PENDING") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Görsel ID zorunludur." },
        { status: 400 }
      );
    }

    const image = await prisma.image.findUnique({
      where: { id },
      include: { step: { include: { process: { select: { authorId: true } } } } },
    });

    if (!image) {
      return NextResponse.json(
        { error: "Görsel bulunamadı." },
        { status: 404 }
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      image.step.process.authorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    await prisma.image.delete({ where: { id } });

    return NextResponse.json({ message: "Görsel silindi." });
  } catch (error) {
    console.error("Görsel silme hatası:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}