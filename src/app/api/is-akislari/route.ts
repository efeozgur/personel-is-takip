import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const categoryId = searchParams.get("categoryId");
  const tagId = searchParams.get("tagId");

  const where: Prisma.ProcessWhereInput = {};

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { steps: { some: { title: { contains: search } } } },
      { steps: { some: { description: { contains: search } } } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (tagId) {
    where.tags = { some: { tagId } };
  }

  const processes = await prisma.process.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { id: true, name: true, icon: true } },
      author: { select: { id: true, name: true } },
      tags: {
        include: { tag: { select: { id: true, name: true } } },
      },
      steps: {
        take: 1,
        orderBy: { order: "asc" },
        select: {
          images: {
            take: 1,
            orderBy: { order: "asc" },
            select: { url: true },
          },
        },
      },
      _count: { select: { steps: true } },
    },
  });

  return NextResponse.json(processes);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role === "PENDING") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  try {
    const { title, description, categoryId, tags } = await request.json();

    if (!title || !categoryId) {
      return NextResponse.json(
        { error: "Başlık ve kategori zorunludur." },
        { status: 400 }
      );
    }

    // Tag adlarından ID çözümle (yoksa oluştur)
    const tagIds: string[] = [];
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

    const process = await prisma.process.create({
      data: {
        title,
        description,
        categoryId,
        authorId: session.user.id,
        tags: tagIds.length
          ? {
              create: tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        category: { select: { id: true, name: true } },
        author: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
      },
    });

    return NextResponse.json(process, { status: 201 });
  } catch (error) {
    console.error("İş akışı oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}
