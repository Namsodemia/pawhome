import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const demo = await prisma.user.upsert({
    where: { email: "demo@pawhome.app" },
    update: {},
    create: {
      name: "Demo Kullanıcı",
      email: "demo@pawhome.app",
      password: passwordHash,
      pets: {
        create: [
          {
            name: "Luna",
            type: "cat",
            breed: "British Shorthair",
            age: 3,
            healthScore: 92,
            energyScore: 78,
          },
        ],
      },
    },
    include: { pets: true },
  });

  const luna = demo.pets[0];
  if (luna) {
    await prisma.reminder.createMany({
      data: [
        {
          userId: demo.id,
          petId: luna.id,
          title: "Karma Aşı",
          description: "Veteriner kliniğinde aşı randevusu",
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
          type: "vaccine",
        },
        {
          userId: demo.id,
          petId: luna.id,
          title: "Akşam Yürüyüşü",
          description: "Park turu",
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 5),
          type: "walk",
        },
      ],
    });
  }

  await prisma.clinic.createMany({
    data: [
      {
        name: "Pati Veteriner Kliniği",
        address: "Bağdat Cad. No:123, Kadıköy",
        phone: "+902161234567",
        latitude: 40.9876,
        longitude: 29.0345,
        status: "acik",
        rating: 4.8,
        ratingCount: 142,
      },
      {
        name: "24 Saat Hayvan Hastanesi",
        address: "Barbaros Bulvarı No:45, Beşiktaş",
        phone: "+902127654321",
        latitude: 41.0431,
        longitude: 29.0067,
        status: "nobetci",
        rating: 4.6,
        ratingCount: 89,
      },
      {
        name: "Dostum Veteriner",
        address: "İstiklal Cad. No:200, Beyoğlu",
        phone: "+902129876543",
        latitude: 41.0359,
        longitude: 28.9788,
        status: "acik",
        rating: 4.9,
        ratingCount: 213,
      },
    ],
  });

  console.log("Seed tamamlandı. Demo giriş: demo@pawhome.app / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
