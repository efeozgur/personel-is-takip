import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data: { name?: string; email?: string } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string") {
        return NextResponse.json(
          { error: "İsim geçersiz." },
          { status: 400 }
        );
      }
      const trimmed = body.name.trim();
      if (trimmed.length < 2) {
        return NextResponse.json(
          { error: "İsim en az 2 karakter olmalıdır." },
          { status: 400 }
        );
      }
      data.name = trimmed;
    }

    if (body.email !== undefined) {
      if (typeof body.email !== "string") {
        return NextResponse.json(
          { error: "E-posta geçersiz." },
          { status: 400 }
        );
      }
      const normalized = body.email.trim().toLowerCase();
      if (!EMAIL_RE.test(normalized)) {
        return NextResponse.json(
          { error: "Geçerli bir e-posta girin." },
          { status: 400 }
        );
      }
      data.email = normalized;
    }

    if (data.name === undefined && data.email === undefined) {
      return NextResponse.json(
        { error: "Güncellenecek en az bir alan gönderin (name veya email)." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(
      { message: "Kullanıcı güncellendi.", user },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Bu e-posta başka bir kullanıcıya ait." },
        { status: 400 }
      );
    }
    console.error("Kullanıcı güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}