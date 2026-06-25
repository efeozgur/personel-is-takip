import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { processes: true },
      },
    },
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  try {
    const { name, description, icon } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Kategori adı zorunludur." },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: { name, description, icon },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Kategori oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  try {
    const { id, name, description, icon } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Kategori ID zorunludur." },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name, description, icon },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Kategori güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Kategori ID zorunludur." },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Kategori silindi." });
  } catch (error) {
    console.error("Kategori silme hatası:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}