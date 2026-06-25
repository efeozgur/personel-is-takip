import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { processes: true } },
    },
  });

  return NextResponse.json(tags);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Etiket adı zorunludur." },
        { status: 400 }
      );
    }

    const existing = await prisma.tag.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { error: "Bu etiket zaten mevcut." },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: { name },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Etiket oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}