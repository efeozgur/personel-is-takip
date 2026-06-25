import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const process = await prisma.process.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        author: { select: { id: true, name: true } },
        steps: {
          orderBy: { order: "asc" },
          include: {
            images: { orderBy: { order: "asc" } },
          },
        },
        tags: {
          include: { tag: { select: { id: true, name: true } } },
        },
      },
    });

    if (!process) {
      return NextResponse.json(
        { error: "İş akışı bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json(process);
  } catch (error) {
    console.error("İş akışı getirme hatası:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existingProcess = await prisma.process.findUnique({
      where: { id },
    });

    if (!existingProcess) {
      return NextResponse.json(
        { error: "İş akışı bulunamadı." },
        { status: 404 }
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      existingProcess.authorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    const { title, description, categoryId, tags } = await request.json();

    // Tag adlarından ID çözümle (yoksa oluştur)
    let tagIds: string[] = [];
    if (tags?.length) {
      for (const t of tags) {
        const name = (typeof t === "string" ? t : "").trim().toLowerCase().replace(/^#/, "");
        if (!name) continue;
        const tag = await prisma.tag.upsert({
          where: { name },
          update: {},
          create: { name },
        });
        tagIds.push(tag.id);
      }
    }

    const process = await prisma.process.update({
      where: { id },
      data: {
        title,
        description,
        categoryId,
        tags: tags
          ? {
              deleteMany: {},
              create: tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        category: { select: { id: true, name: true } },
        author: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        steps: {
          orderBy: { order: "asc" },
          include: { images: { orderBy: { order: "asc" } } },
        },
      },
    });

    return NextResponse.json(process);
  } catch (error) {
    console.error("İş akışı güncelleme hatası:", error);
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
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existingProcess = await prisma.process.findUnique({
      where: { id },
    });

    if (!existingProcess) {
      return NextResponse.json(
        { error: "İş akışı bulunamadı." },
        { status: 404 }
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      existingProcess.authorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    await prisma.process.delete({
      where: { id },
    });

    return NextResponse.json({ message: "İş akışı silindi." });
  } catch (error) {
    console.error("İş akışı silme hatası:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}