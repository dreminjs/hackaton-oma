import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaClient } from '@prisma/client';

describe('OMA Lab Backend E2E (Demo Flow)', () => {
  let app: INestApplication;
  let token: string;
  let truckLesson1Id: string;
  let truckLesson2Id: string;
  let nestLesson1Id: string;

  beforeAll(async () => {
    // Reset test codes and user progress to ensure pure reproducibility
    const prisma = new PrismaClient();
    await prisma.chatMessage.deleteMany();
    await prisma.chatSession.deleteMany();
    await prisma.userSkill.deleteMany();
    await prisma.lessonProgress.deleteMany();
    await prisma.kitCode.updateMany({
      data: { userId: null, activatedAt: null },
    });
    await prisma.user.deleteMany();
    await prisma.$disconnect();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  // Health
  it('GET /api/health should return 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(res.body).toEqual({ status: 'ok' });
  });

  // Step 1: POST /api/session, PATCH /api/me
  it('Step 1: POST /api/session and PATCH /api/me', async () => {
    const sessionRes = await request(app.getHttpServer())
      .post('/api/session')
      .expect(201);

    expect(sessionRes.body).toHaveProperty('token');
    expect(sessionRes.body).toHaveProperty('user');
    expect(sessionRes.body.user.stars).toBe(0);
    token = sessionRes.body.token;

    const meRes = await request(app.getHttpServer())
      .patch('/api/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Тестовый Ребёнок', age: 7 })
      .expect(200);

    expect(meRes.body.name).toBe('Тестовый Ребёнок');
    expect(meRes.body.age).toBe(7);

    // Verify GET /api/me
    const getMeRes = await request(app.getHttpServer())
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(getMeRes.body.name).toBe('Тестовый Ребёнок');
  });

  // Step 2: POST /api/activations with OMA-TRUCK-001, appears in GET /api/me/kits
  it('Step 2: POST /api/activations and GET /api/me/kits', async () => {
    const actRes = await request(app.getHttpServer())
      .post('/api/activations')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'oma-truck-001' })
      .expect(201);

    expect(actRes.body.kit.slug).toBe('truck');
    expect(actRes.body.kit.activated).toBe(true);

    const myKitsRes = await request(app.getHttpServer())
      .get('/api/me/kits')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const truck = myKitsRes.body.find((k: any) => k.slug === 'truck');
    expect(truck).toBeDefined();
    expect(truck.progressPercent).toBe(0);

    // Get truck lessons to know IDs
    const lessonsRes = await request(app.getHttpServer())
      .get('/api/kits/truck/lessons')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(lessonsRes.body.length).toBe(2);
    truckLesson1Id = lessonsRes.body[0].id;
    truckLesson2Id = lessonsRes.body[1].id;
    expect(lessonsRes.body[0].status).toBe('CURRENT');
    expect(lessonsRes.body[1].status).toBe('LOCKED');
  });

  // Step 3: Start and complete lesson 1: 1 star, lesson 2 becomes CURRENT
  it('Step 3: Start and complete truck lesson 1', async () => {
    await request(app.getHttpServer())
      .post(`/api/me/lessons/${truckLesson1Id}/start`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(201);

    const compRes = await request(app.getHttpServer())
      .post(`/api/me/lessons/${truckLesson1Id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(compRes.body.stars).toBe(1);

    // Check lessons status again
    const lessonsRes = await request(app.getHttpServer())
      .get('/api/kits/truck/lessons')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(lessonsRes.body[0].status).toBe('DONE');
    expect(lessonsRes.body[1].status).toBe('CURRENT');
  });

  // Step 4: Complete lesson 2: skill awarded
  it('Step 4: Start and complete truck lesson 2 -> screwdriver skill awarded', async () => {
    await request(app.getHttpServer())
      .post(`/api/me/lessons/${truckLesson2Id}/start`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(201);

    const compRes = await request(app.getHttpServer())
      .post(`/api/me/lessons/${truckLesson2Id}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(compRes.body.stars).toBe(2);
    expect(compRes.body.skillAwarded).toBeDefined();
    expect(compRes.body.skillAwarded.title).toBe('Отвёртка');

    // Profile check
    const profRes = await request(app.getHttpServer())
      .get('/api/me/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(profRes.body.stars).toBe(2);
    expect(profRes.body.lessonsDone).toBe(2);
    expect(profRes.body.skills.some((s: any) => s.title === 'Отвёртка')).toBe(true);
    const truckKit = profRes.body.kits.find((k: any) => k.slug === 'truck');
    expect(truckKit.progressPercent).toBe(100);
    expect(truckKit.completed).toBe(true);
  });

  // Step 5: Activate OMA-NEST-001, start without adultConfirmed fails with 400, with flag succeeds
  it('Step 5: Nest kit activation and adultConfirmed check', async () => {
    await request(app.getHttpServer())
      .post('/api/activations')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'OMA-NEST-001' })
      .expect(201);

    const lessonsRes = await request(app.getHttpServer())
      .get('/api/kits/nest/lessons')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    nestLesson1Id = lessonsRes.body[0].id;

    // Start without adultConfirmed -> 400 ADULT_CONFIRMATION_REQUIRED
    const failRes = await request(app.getHttpServer())
      .post(`/api/me/lessons/${nestLesson1Id}/start`)
      .set('Authorization', `Bearer ${token}`)
      .send({ adultConfirmed: false })
      .expect(400);

    expect(failRes.body.code).toBe('ADULT_CONFIRMATION_REQUIRED');

    // Start with adultConfirmed: true -> 201 success
    const okRes = await request(app.getHttpServer())
      .post(`/api/me/lessons/${nestLesson1Id}/start`)
      .set('Authorization', `Bearer ${token}`)
      .send({ adultConfirmed: true })
      .expect(201);

    expect(okRes.body.success).toBe(true);
  });

  // Step 6: Omik question and danger word check
  it('Step 6: Chat Omik session, normal message and danger word', async () => {
    const sessionRes = await request(app.getHttpServer())
      .post('/api/chat/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(201);

    const sessionId = sessionRes.body.sessionId;

    // Danger question: "что делать если пошел дым?"
    const dangerRes = await request(app.getHttpServer())
      .post(`/api/chat/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'что делать если пошел дым?' })
      .expect(201);

    expect(dangerRes.body.reply).toBe('Остановись и позови взрослого. Если опасно, звони 112');

    // History check
    const histRes = await request(app.getHttpServer())
      .get(`/api/chat/sessions/${sessionId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(histRes.body.length).toBe(2);
  });

  // Step 7: GET /api/stores?kit=nest
  it('Step 7: GET /api/stores?kit=nest returns stores in stock', async () => {
    const storesRes = await request(app.getHttpServer())
      .get('/api/stores?kit=nest')
      .expect(200);

    expect(Array.isArray(storesRes.body)).toBe(true);
    expect(storesRes.body.length).toBeGreaterThan(0);
    for (const store of storesRes.body) {
      const nestKit = store.kits.find((k: any) => k.slug === 'nest');
      expect(nestKit).toBeDefined();
      expect(nestKit.inStock).toBe(true);
    }
  });

  // Additional check: B14 Recovery code
  it('B14: Recovery code generation and restore session', async () => {
    const codeRes = await request(app.getHttpServer())
      .post('/api/me/recovery-code')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(codeRes.body).toHaveProperty('code');
    const recoveryCode = codeRes.body.code;
    expect(recoveryCode.length).toBe(8);

    const restoreRes = await request(app.getHttpServer())
      .post('/api/session/restore')
      .send({ code: recoveryCode })
      .expect(201);

    expect(restoreRes.body.user.name).toBe('Тестовый Ребёнок');
    expect(restoreRes.body.user.stars).toBe(2);
  });
});
