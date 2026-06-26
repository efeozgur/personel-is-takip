// SQLite'ta enum desteklenmediği için Role string olarak tutuluyor
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed başlatılıyor...\n");

  // 1. Admin kullanıcısını bul veya oluştur
  const adminEmail = "admin@ozgurapp.com";
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: "Admin Kullanıcı",
        email: adminEmail,
        password: await bcrypt.hash("admin123", 12),
        role: "ADMIN",
      },
    });
    console.log("✅ Admin kullanıcısı oluşturuldu: admin@ozgurapp.com / admin123");
  } else {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN" },
    });
    console.log("✅ Admin kullanıcısı ADMIN yapıldı.");
  }

  // 2. Örnek personel kullanıcısı
  const personelEmail = "personel@ozgurapp.com";
  let personel = await prisma.user.findUnique({ where: { email: personelEmail } });
  if (!personel) {
    personel = await prisma.user.create({
      data: {
        name: "Ahmet Yılmaz",
        email: personelEmail,
        password: await bcrypt.hash("personel123", 12),
        role: "USER",
      },
    });
    console.log("✅ Personel kullanıcısı oluşturuldu: personel@ozgurapp.com / personel123");
  }

  // 3. Kategoriler
  const kategoriData = [
    { name: "Gelen Evrak", description: "Gelen evrak işlemleri", icon: "📨" },
    { name: "Giden Evrak", description: "Giden evrak işlemleri", icon: "📤" },
    { name: "Dilekçe", description: "Dilekçe işlemleri", icon: "📝" },
    { name: "Arşiv", description: "Arşiv ve dosyalama işlemleri", icon: "🗄️" },
    { name: "Tarama", description: "Tarama ve dijitalleştirme işlemleri", icon: "🖨️" },
  ];

  const categories: Record<string, string> = {};
  for (const kat of kategoriData) {
    let category = await prisma.category.findFirst({ where: { name: kat.name } });
    if (!category) {
      category = await prisma.category.create({ data: kat });
    }
    categories[kat.name] = category.id;
  }
  console.log("✅ Kategoriler oluşturuldu.");

  // 4. Etiketler
  const tagData = ["önemli", "acil", "günlük", "haftalık", "rehber", "başlangıç"];
  for (const tagName of tagData) {
    const existing = await prisma.tag.findUnique({ where: { name: tagName } });
    if (!existing) {
      await prisma.tag.create({ data: { name: tagName } });
    }
  }
  console.log("✅ Etiketler oluşturuldu.");

  // Etiketleri al
  const tags = await prisma.tag.findMany();
  const tagMap: Record<string, string> = {};
  tags.forEach((t) => (tagMap[t.name] = t.id));

  // 5. İş Akışları
  const processCount = await prisma.process.count();
  if (processCount === 0) {
    // İş Akışı 1: Dilekçe İşleme
    const p1 = await prisma.process.create({
      data: {
        title: "Gelen Dilekçelerin İşlenmesi",
        description:
          "Birimimize gelen dilekçelerin havale edilmesi, kaydedilmesi ve ilgili personele iletilmesi sürecini adım adım anlatır.",
        categoryId: categories["Dilekçe"],
        authorId: admin.id,
        tags: {
          create: [{ tagId: tagMap["önemli"] }, { tagId: tagMap["günlük"] }, { tagId: tagMap["rehber"] }],
        },
        steps: {
          create: [
            {
              order: 1,
              title: "Dilekçeyi Teslim Alın",
              description:
                "Gelen dilekçeyi evrak kayıt biriminden imza karşılığı teslim alın.\n\n📌 Dikkat: Dilekçenin üzerinde tarih ve saat damgası olduğundan emin olun.",
            },
            {
              order: 2,
              title: "Evrak Kayıt Defterine Kaydedin",
              description:
                "Dilekçeyi evrak kayıt defterine aşağıdaki bilgilerle kaydedin:\n\n1. Geliş tarihi\n2. Dilekçe sahibinin adı soyadı\n3. Dilekçe konusu\n4. Havale edilecek birim\n\nKayıt numarasını dilekçenin sağ üst köşesine yazın.",
            },
            {
              order: 3,
              title: "Dijital Kayıt Oluşturun",
              description:
                "Dilekçeyi tarayarak EBYS (Elektronik Belge Yönetim Sistemi) üzerinde dijital kaydını oluşturun.\n\n💡 İpucu: Tarama çözünürlüğünü 300 DPI olarak ayarlayın.",
            },
            {
              order: 4,
              title: "İlgili Birime Havale Edin",
              description:
                "Dilekçenin içeriğine göre ilgili birim/büro amirine havale edin.\n\n- Acil dilekçeler için kırmızı klasör kullanın\n- Normal dilekçeler için mavi klasör kullanın\n- Havale ederken zimmet defterine kaydedin",
            },
            {
              order: 5,
              title: "Takip ve Kapatma",
              description:
                "Havale edilen dilekçenin akıbetini 3 iş günü içinde takip edin. Sonuçlandığında evrak kayıt defterine kapatma tarihi ekleyin.",
            },
          ],
        },
      },
    });
    console.log("✅ İş Akışı 1: Gelen Dilekçelerin İşlenmesi");

    // İş Akışı 2: Evrak Tarama
    const p2 = await prisma.process.create({
      data: {
        title: "Evrak Tarama ve Dijital Arşivleme",
        description:
          "Fiziksel evrakların taranarak dijital ortama aktarılması ve EBYS üzerinde arşivlenmesi adımları.",
        categoryId: categories["Tarama"],
        authorId: personel.id,
        tags: {
          create: [{ tagId: tagMap["günlük"] }, { tagId: tagMap["rehber"] }, { tagId: tagMap["başlangıç"] }],
        },
        steps: {
          create: [
            {
              order: 1,
              title: "Tarayıcıyı Hazırlayın",
              description:
                "Tarayıcının açık ve çalışır durumda olduğunu kontrol edin.\n\n- Tarayıcı camının temiz olduğundan emin olun\n- ADF (otomatik belge besleyici) varsa kontrol edin",
            },
            {
              order: 2,
              title: "Tarama Ayarlarını Yapın",
              description:
                "Aşağıdaki tarama ayarlarını kontrol edin:\n\n• Çözünürlük: 300 DPI\n• Renk: Siyah-Beyaz (yazılı belgeler için)\n• Dosya formatı: PDF\n• Kağıt boyutu: A4\n• Çift taraflı tarama: Açık",
            },
            {
              order: 3,
              title: "Evrakları Sırayla Taranın",
              description:
                "Evrakları sırasına göre tarayıcıya yerleştirin:\n\n1. Zımbalı/telli evrakların zımbalarını çıkarın\n2. Sayfaları düzgünce sıralayın\n3. ADF kullanıyorsanız en fazla 50 sayfa koyun\n4. Taramayı başlatın",
            },
            {
              order: 4,
              title: "Taranan Dosyayı Kontrol Edin",
              description:
                "Taranan PDF dosyasını açarak kontrol edin:\n\n- Tüm sayfalar tarandı mı?\n- Sayfalar doğru sırada mı?\n- Okunaklı mı?\n- Boş/ters sayfa var mı?\n\nSorun varsa ilgili sayfaları tekrar tarayın.",
            },
            {
              order: 5,
              title: "EBYS'ye Yükleyin ve Arşivleyin",
              description:
                "Taranan dosyayı EBYS üzerinde ilgili evrak kaydına ekleyin:\n\n1. EBYS'de evrak kaydını bulun\n2. 'Dijital Kopya Ekle' butonuna tıklayın\n3. PDF dosyasını yükleyin\n4. Açıklama alanına 'Taranmış evrak' yazın\n5. Kaydedin",
            },
          ],
        },
      },
    });
    console.log("✅ İş Akışı 2: Evrak Tarama ve Dijital Arşivleme");

    // İş Akışı 3: Giden Evrak
    const p3 = await prisma.process.create({
      data: {
        title: "Giden Evrak Gönderim İşlemleri",
        description:
          "Birim tarafından hazırlanan resmi yazıların gönderim öncesi kontrolleri, zimmetlenmesi ve postaya verilmesi adımları.",
        categoryId: categories["Giden Evrak"],
        authorId: admin.id,
        tags: {
          create: [{ tagId: tagMap["önemli"] }, { tagId: tagMap["haftalık"] }],
        },
        steps: {
          create: [
            {
              order: 1,
              title: "Yazıyı Format Kontrolünden Geçirin",
              description:
                "Resmi yazının formatını kontrol edin:\n\n✅ Kurum logosu ve başlığı\n✅ Tarih ve sayı numarası\n✅ Muhatap bilgileri doğru mu?\n✅ İmza/paraf tamam mı?\n✅ Ekler belirtilmiş mi?",
            },
            {
              order: 2,
              title: "Zarflama ve Paketleme",
              description:
                "Yazıyı ve eklerini zarfa koyun:\n\n1. Gideceği adresi zarfın üzerine yazın\n2. Gizlilik derecesi varsa belirtin (GİZLİ, HİZMETE ÖZEL vb.)\n3. Eklerin tam olduğundan emin olun\n4. Zarfı kapatın",
            },
            {
              order: 3,
              title: "Zimmet Defterine Kaydedin",
              description:
                "Giden evrak zimmet defterine kaydedin:\n\n• Sıra no\n• Gideceği kurum/birim\n• Yazının sayısı\n• Gönderim tarihi\n• Gönderiyi alan kişinin imzası",
            },
            {
              order: 4,
              title: "Postaya Teslim Edin",
              description:
                "Hazırlanan gönderiyi posta birimine teslim edin. APS veya iadeli taahhütlü gerekiyorsa belirtin.\n\n📌 Posta alındı belgesini zimmet defteriyle birlikte saklayın.",
            },
          ],
        },
      },
    });
    console.log("✅ İş Akışı 3: Giden Evrak Gönderim İşlemleri");

    // İş Akışı 4: Arşiv
    const p4 = await prisma.process.create({
      data: {
        title: "Yıl Sonu Arşiv Düzenleme",
        description:
          "Her yıl sonunda yapılması gereken arşiv düzenleme ve dosyalama işlemlerinin adım adım rehberi.",
        categoryId: categories["Arşiv"],
        authorId: personel.id,
        tags: {
          create: [{ tagId: tagMap["haftalık"] }, { tagId: tagMap["başlangıç"] }],
        },
        steps: {
          create: [
            {
              order: 1,
              title: "Evrakları Yıllara Göre Ayırın",
              description:
                "Tüm evrakları yıllara göre ayırın. Geçmiş yıla ait tüm dosyaları bir araya toplayın.",
            },
            {
              order: 2,
              title: "Dosya Sırtlıklarını Hazırlayın",
              description:
                "Standart arşiv dosya sırtlıklarına şu bilgileri yazın:\n\n• Yıl\n• Birim adı\n• Dosya konusu\n• Raf numarası\n• Saklama süresi",
            },
            {
              order: 3,
              title: "İmha Edilecekleri Belirleyin",
              description:
                "Saklama süresi dolmuş evrakları belirleyin. İmha tutanağı hazırlayarak komisyon onayına sunun.",
            },
            {
              order: 4,
              title: "Arşiv Kaydı Oluşturun",
              description:
                "Düzenlenen dosyaları arşiv kayıt defterine işleyin ve ilgili rafa yerleştirin. Yer numarasını deftere not edin.",
            },
          ],
        },
      },
    });
    console.log("✅ İş Akışı 4: Yıl Sonu Arşiv Düzenleme");
  }

  console.log("\n🎉 Seed tamamlandı!");
  console.log("───────────────────────────────");
  console.log("👤 Admin: admin@ozgurapp.com / admin123");
  console.log("👤 Personel: personel@ozgurapp.com / personel123");
  console.log("───────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });