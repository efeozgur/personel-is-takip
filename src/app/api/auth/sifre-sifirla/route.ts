import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Sıfırlama bağlantısı geçersiz." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Yeni şifre en az 8 karakter olmalıdır." },
        { status: 400 }
      );
    }

    const reset = await prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!reset || reset.expires < new Date()) {
      return NextResponse.json(
        { error: "Sıfırlama bağlantısı geçersiz veya süresi dolmuş." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordReset.delete({ where: { id: reset.id } }),
    ]);

    return NextResponse.json(
      { message: "Şifreniz güncellendi. Giriş yapabilirsiniz." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Şifre sıfırlama hatası:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}