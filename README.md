# Personel İş Akışı

Next.js 16 + Prisma + SQLite + NextAuth ile geliştirilmiş personel iş akışı yönetim sistemi.

## Veritabanı

Proje **SQLite** kullanır (dosya tabanlı). Ek bir veritabanı sunucusuna gerek yoktur.

- Varsayılan geliştirme veritabanı: `prisma/dev.db`
- Bağlantı ayarı: `.env` içindeki `DATABASE_URL=file:./dev.db`

## Getting Started

### 1. Bağımlılıkları yükle

```bash
npm install
```

### 2. Veritabanını oluştur ve seed verisini yükle

```bash
npx prisma migrate dev --name init
npm run seed
```

Bu komut `prisma/dev.db` dosyasını oluşturur, tabloları migrate eder ve örnek admin/personel kullanıcıları ile kategorileri/iş akışlarını ekler.

### 3. Geliştirme sunucusunu başlat

```bash
npm run dev
```

Tarayıcıdan [http://localhost:3000](http://localhost:3000) adresini açın.

## Üretim (Production) için

```bash
npm run build
npx prisma migrate deploy
npm run seed        # sadece ilk kurulumda
npm start
```

> Not: SQLite dosyası (`prisma/dev.db`) ve `public/uploads/` klasörü sunucu/container arasında taşınırken korunmalıdır.

## Varsayılan Kullanıcılar (seed)

| Rol     | E-posta                  | Şifre         |
|---------|--------------------------|---------------|
| ADMIN   | admin@ozgurapp.com       | admin123      |
| USER    | personel@ozgurapp.com    | personel123   |
| PENDING | (kayıt sonrası onay gerekir) | -         |

> ⚠️ Bu bilgiler sadece geliştirme/demo amaçlıdır. Üretim ortamında mutlaka değiştirin.

## Faydalı Prisma Komutları

```bash
npx prisma migrate dev        # Geliştirme: migration oluştur ve uygula
npx prisma migrate deploy     # Üretim: migration'ı uygula
npx prisma studio             # Görsel veritabanı editörü
npx prisma generate           # Prisma Client'ı yeniden üret
npm run seed                  # Örnek verileri ekle
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma + SQLite](https://www.prisma.io/docs/orm/overview/databases/sqlite)
