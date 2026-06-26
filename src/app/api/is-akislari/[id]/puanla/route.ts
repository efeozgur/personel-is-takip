import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recomputeProcessRating } from "@/lib/rating";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role === "PENDING") {
    return NextResponse.json(
      { error: "Bu işlem için giriş yapmalısınız." },
      { status: 403 }
    );
  }

  const { id: processId } = await params;

  let score: number;
  try {
    const body = await request.json();
    if (typeof body.score !== "number" || !Number.isInteger(body.score)) {
      return NextResponse.json(
        { error: "Puan 1 ile 5 arasında bir tam sayı olmalıdır." },
        { status: 400 }
      );
    }
    if (body.score < 1 || body.score > 5) {
      return NextResponse.json(
        { error: "Puan 1 ile 5 arasında olmalıdır." },
        { status: 400 }
      );
    }
    score = body.score;
  } catch {
    return NextResponse.json(
      { error: "Geçersiz istek gövdesi." },
      { status: 400 }
    );
  }

  const process = await prisma.process.findUnique({
    where: { id: processId },
    select: { id: true, authorId: true },
  });
  if (!process) {
    return NextResponse.json(
      { error: "İş akışı bulunamadı." },
      { status: 404 }
    );
  }
  if (process.authorId === session.user.id) {
    return NextResponse.json(
      { error: "Kendi iş akışınızı puanlayamazsınız." },
      { status: 403 }
    );
  }

  try {
    await prisma.rating.upsert({
      where: {
        processId_userId: {
          processId,
          userId: session.user.id,
        },
      },
      update: { score },
      create: {
        processId,
        userId: session.user.id,
        score,
      },
    });
    await recomputeProcessRating(processId);

    const updated = await prisma.process.findUnique({
      where: { id: processId },
      select: { ratingCount: true, ratingAverage: true },
    });

    return NextResponse.json(
      {
        message: "Puanınız kaydedildi.",
        myRating: score,
        ratingCount: updated?.ratingCount ?? 0,
        ratingAverage: updated?.ratingAverage ?? 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Puanlama hatası:", error);
    return NextResponse.json(
      { error: "Puan kaydedilirken bir hata oluştu." },
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
    return NextResponse.json(
      { error: "Bu işlem için giriş yapmalısınız." },
      { status: 403 }
    );
  }

  const { id: processId } = await params;

  try {
    await prisma.rating.delete({
      where: {
        processId_userId: {
          processId,
          userId: session.user.id,
        },
      },
    });
  } catch (error) {
    // P2025: kayıt bulunamadı — idempotent davranış (zaten yoksa sorun değil)
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "P2025"
    ) {
      // düşmeye devam et, istatistikleri yine de tazele
    } else {
      console.error("Puan kaldırma hatası:", error);
      return NextResponse.json(
        { error: "Puan kaldırılırken bir hata oluştu." },
        { status: 500 }
      );
    }
  }

  await recomputeProcessRating(processId);

  const updated = await prisma.process.findUnique({
    where: { id: processId },
    select: { ratingCount: true, ratingAverage: true },
  });

  return NextResponse.json(
    {
      message: "Puanınız kaldırıldı.",
      ratingCount: updated?.ratingCount ?? 0,
      ratingAverage: updated?.ratingAverage ?? 0,
    },
    { status: 200 }
  );
}