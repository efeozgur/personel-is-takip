import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 saat

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "E-posta adresi zorunludur." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Kullanıcı enumeration'ı önlemek için: kullanıcı yoksa bile aynı mesajı dön.
    if (!user) {
      return NextResponse.json(
        {
          message:
            "Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı oluşturuldu.",
        },
        { status: 200 }
      );
    }

    // Aynı kullanıcı için önceki token'ları temizle (tek aktif token).
    await prisma.passwordReset.deleteMany({ where: { userId: user.id } });

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.passwordReset.create({
      data: { userId: user.id, token, expires },
    });

    const baseUrl =
      process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/sifre-sifirla/${token}`;

    // Dev ortamı: SMTP yok, bu yüzden linki yanıtta döndürüyoruz.
    // Üretimde burası `await sendEmail({ to: user.email, ... })` olur.
    return NextResponse.json(
      {
        message:
          "Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı oluşturuldu.",
        resetUrl,
        expiresAt: expires.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Şifremi unuttum hatası:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu." },
      { status: 500 }
    );
  }
}