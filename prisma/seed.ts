import { PrismaClient, KitMode } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Skills
  const screwdriverSkill = await prisma.skill.upsert({
    where: { id: 'skill-screwdriver' },
    update: { title: 'Отвёртка' },
    create: {
      id: 'skill-screwdriver',
      title: 'Отвёртка',
    },
  });

  const hammerSkill = await prisma.skill.upsert({
    where: { id: 'skill-hammer' },
    update: { title: 'Молоток' },
    create: {
      id: 'skill-hammer',
      title: 'Молоток',
    },
  });

  // 2. Kit: Грузовичок (truck)
  const truckKit = await prisma.kit.upsert({
    where: { slug: 'truck' },
    update: {
      title: 'Грузовичок',
      description: 'Собери свой первый деревянный грузовичок с вращающимися колёсами.',
      minAge: 6,
      mode: KitMode.SOLO,
      tool: 'Отвёртка',
      difficulty: 1,
      buyUrl: 'https://oma.by/catalog/kit-truck',
      coverUrl: 'https://oma.by/images/kits/truck.png',
    },
    create: {
      slug: 'truck',
      title: 'Грузовичок',
      description: 'Собери свой первый деревянный грузовичок с вращающимися колёсами.',
      minAge: 6,
      mode: KitMode.SOLO,
      tool: 'Отвёртка',
      difficulty: 1,
      buyUrl: 'https://oma.by/catalog/kit-truck',
      coverUrl: 'https://oma.by/images/kits/truck.png',
    },
  });

  // 3. Kit: Скворечник (nest)
  const nestKit = await prisma.kit.upsert({
    where: { slug: 'nest' },
    update: {
      title: 'Скворечник',
      description: 'Построй настоящий уютный домик для птиц вместе со взрослым.',
      minAge: 8,
      mode: KitMode.PARENT,
      tool: 'Молоток',
      difficulty: 2,
      buyUrl: 'https://oma.by/catalog/kit-nest',
      coverUrl: 'https://oma.by/images/kits/nest.png',
    },
    create: {
      slug: 'nest',
      title: 'Скворечник',
      description: 'Построй настоящий уютный домик для птиц вместе со взрослым.',
      minAge: 8,
      mode: KitMode.PARENT,
      tool: 'Молоток',
      difficulty: 2,
      buyUrl: 'https://oma.by/catalog/kit-nest',
      coverUrl: 'https://oma.by/images/kits/nest.png',
    },
  });

  // 4. Lessons & Steps for Truck
  // Lesson 1: Знакомство с отвёрткой (3 шага)
  const truckLesson1 = await prisma.lesson.upsert({
    where: { id: 'lesson-truck-1' },
    update: {
      kitId: truckKit.id,
      order: 1,
      title: 'Знакомство с отвёрткой',
      skillId: null,
    },
    create: {
      id: 'lesson-truck-1',
      kitId: truckKit.id,
      order: 1,
      title: 'Знакомство с отвёрткой',
      skillId: null,
    },
  });

  const truck1Steps = [
    { order: 1, text: 'Возьми отвёртку за рукоятку удобной рукой. Не держись за металлический стержень.' },
    { order: 2, text: 'Посмотри на жало отвёртки и на шляпку винтика — крестик должен точно попадать в паз.' },
    { order: 3, text: 'Попробуй плавно повернуть отвёртку по часовой стрелке — так винтик закручивается!' },
  ];

  for (const step of truck1Steps) {
    const stepId = `step-truck-1-${step.order}`;
    await prisma.lessonStep.upsert({
      where: { id: stepId },
      update: { text: step.text, order: step.order },
      create: { id: stepId, lessonId: truckLesson1.id, order: step.order, text: step.text },
    });
  }

  // Lesson 2: Закрути винтик (4 шага, даёт навык «Отвёртка»)
  const truckLesson2 = await prisma.lesson.upsert({
    where: { id: 'lesson-truck-2' },
    update: {
      kitId: truckKit.id,
      order: 2,
      title: 'Закрути винтик',
      skillId: screwdriverSkill.id,
    },
    create: {
      id: 'lesson-truck-2',
      kitId: truckKit.id,
      order: 2,
      title: 'Закрути винтик',
      skillId: screwdriverSkill.id,
    },
  });

  const truck2Steps = [
    { order: 1, text: 'Соедини две деревянные детали кузова грузовичка так, чтобы отверстия совпали.' },
    { order: 2, text: 'Вставь винтик в отверстие и слегка наживи его пальцами.' },
    { order: 3, text: 'Приставь отвёртку строго вертикально и медленно крути по часовой стрелке.' },
    { order: 4, text: 'Затяни винтик до упора, но без лишней силы. Отличная работа!' },
  ];

  for (const step of truck2Steps) {
    const stepId = `step-truck-2-${step.order}`;
    await prisma.lessonStep.upsert({
      where: { id: stepId },
      update: { text: step.text, order: step.order },
      create: { id: stepId, lessonId: truckLesson2.id, order: step.order, text: step.text },
    });
  }

  // 5. Lessons & Steps for Nest
  // Lesson 1: Держим молоток (3 шага)
  const nestLesson1 = await prisma.lesson.upsert({
    where: { id: 'lesson-nest-1' },
    update: {
      kitId: nestKit.id,
      order: 1,
      title: 'Держим молоток',
      skillId: null,
    },
    create: {
      id: 'lesson-nest-1',
      kitId: nestKit.id,
      order: 1,
      title: 'Держим молоток',
      skillId: null,
    },
  });

  const nest1Steps = [
    { order: 1, text: 'Попроси взрослого быть рядом и контролировать процесс.' },
    { order: 2, text: 'Возьми молоток ближе к концу рукоятки для хорошего рычага и контроля.' },
    { order: 3, text: 'Сделай несколько пробных взмахов в воздухе, сохраняя ровную траекторию.' },
  ];

  for (const step of nest1Steps) {
    const stepId = `step-nest-1-${step.order}`;
    await prisma.lessonStep.upsert({
      where: { id: stepId },
      update: { text: step.text, order: step.order },
      create: { id: stepId, lessonId: nestLesson1.id, order: step.order, text: step.text },
    });
  }

  // Lesson 2: Забиваем гвоздь (4 шага, даёт навык «Молоток»)
  const nestLesson2 = await prisma.lesson.upsert({
    where: { id: 'lesson-nest-2' },
    update: {
      kitId: nestKit.id,
      order: 2,
      title: 'Забиваем гвоздь',
      skillId: hammerSkill.id,
    },
    create: {
      id: 'lesson-nest-2',
      kitId: nestKit.id,
      order: 2,
      title: 'Забиваем гвоздь',
      skillId: hammerSkill.id,
    },
  });

  const nest2Steps = [
    { order: 1, text: 'Убедись, что рядом взрослый. Надень защитные перчатки.' },
    { order: 2, text: 'Взрослый помогает придерживать дощечку. Наставь гвоздь в намеченную точку.' },
    { order: 3, text: 'Легкими точными ударами наживи гвоздь в древесину.' },
    { order: 4, text: 'Убери пальцы от гвоздя и уверенными ударами бойка забей его до шляпки.' },
  ];

  for (const step of nest2Steps) {
    const stepId = `step-nest-2-${step.order}`;
    await prisma.lessonStep.upsert({
      where: { id: stepId },
      update: { text: step.text, order: step.order },
      create: { id: stepId, lessonId: nestLesson2.id, order: step.order, text: step.text },
    });
  }

  // 6. Kit Codes: OMA-TRUCK-001..003 and OMA-NEST-001..003
  const truckCodes = ['OMA-TRUCK-001', 'OMA-TRUCK-002', 'OMA-TRUCK-003'];
  for (const code of truckCodes) {
    await prisma.kitCode.upsert({
      where: { code },
      update: {},
      create: { code, kitId: truckKit.id },
    });
  }

  const nestCodes = ['OMA-NEST-001', 'OMA-NEST-002', 'OMA-NEST-003'];
  for (const code of nestCodes) {
    await prisma.kitCode.upsert({
      where: { code },
      update: {},
      create: { code, kitId: nestKit.id },
    });
  }

  // 7. Stores (6 stores in Minsk and region)
  const storesData = [
    {
      id: 'store-minsk-1',
      name: 'ОМА Боровляны',
      address: 'д. Боровляны, ул. 40 лет Победы, 24',
      lat: 53.9984,
      lng: 27.6745,
      hours: 'Пн-Вс: 08:00 - 22:00',
      kits: [{ kitId: truckKit.id, inStock: true }, { kitId: nestKit.id, inStock: true }],
    },
    {
      id: 'store-minsk-2',
      name: 'ОМА Каменная Горка',
      address: 'г. Минск, ул. Каменногорская, 118',
      lat: 53.9189,
      lng: 27.4298,
      hours: 'Пн-Вс: 08:00 - 22:00',
      kits: [{ kitId: truckKit.id, inStock: true }, { kitId: nestKit.id, inStock: false }],
    },
    {
      id: 'store-minsk-3',
      name: 'ОМА Ванеева',
      address: 'г. Минск, пр-т Партизанский, 36',
      lat: 53.8761,
      lng: 27.6047,
      hours: 'Пн-Вс: 08:00 - 21:00',
      kits: [{ kitId: truckKit.id, inStock: false }, { kitId: nestKit.id, inStock: true }],
    },
    {
      id: 'store-minsk-4',
      name: 'ОМА Шабаны',
      address: 'г. Минск, ул. Селицкого, 26',
      lat: 53.8294,
      lng: 27.7011,
      hours: 'Пн-Вс: 08:00 - 21:00',
      kits: [{ kitId: truckKit.id, inStock: true }, { kitId: nestKit.id, inStock: true }],
    },
    {
      id: 'store-minsk-5',
      name: 'ОМА Дзержинск',
      address: 'г. Дзержинск, ул. Фоминых, 9',
      lat: 53.6842,
      lng: 27.1354,
      hours: 'Пн-Вс: 09:00 - 20:00',
      kits: [{ kitId: truckKit.id, inStock: true }, { kitId: nestKit.id, inStock: false }],
    },
    {
      id: 'store-minsk-6',
      name: 'ОМА Жодино',
      address: 'г. Жодино, ул. Ленина, 15',
      lat: 54.1012,
      lng: 28.3491,
      hours: 'Пн-Вс: 09:00 - 20:00',
      kits: [{ kitId: truckKit.id, inStock: true }, { kitId: nestKit.id, inStock: true }],
    },
  ];

  for (const store of storesData) {
    const { kits, ...storeInfo } = store;
    await prisma.store.upsert({
      where: { id: storeInfo.id },
      update: storeInfo,
      create: storeInfo,
    });

    for (const item of kits) {
      await prisma.storeKit.upsert({
        where: {
          storeId_kitId: {
            storeId: storeInfo.id,
            kitId: item.kitId,
          },
        },
        update: { inStock: item.inStock },
        create: {
          storeId: storeInfo.id,
          kitId: item.kitId,
          inStock: item.inStock,
        },
      });
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
