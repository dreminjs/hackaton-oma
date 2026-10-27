import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterKitsDto } from './dto/filter-kits.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { LessonStatus, Prisma } from '@prisma/client';

@Injectable()
export class KitsService {
  constructor(private readonly prisma: PrismaService) {}

  async getKits(dto: FilterKitsDto, userId?: string) {
    const where: Prisma.KitWhereInput = {};

    if (dto.age) {
      where.minAge = { lte: parseInt(dto.age, 10) };
    }
    if (dto.difficulty) {
      where.difficulty = parseInt(dto.difficulty, 10);
    }
    if (dto.mode) {
      where.mode = dto.mode;
    }

    const kits = await this.prisma.kit.findMany({
      where,
      include: {
        lessons: {
          select: { id: true },
        },
      },
      orderBy: { minAge: 'asc' },
    });

    let activatedKitIds = new Set<string>();
    let doneLessonIds = new Set<string>();

    if (userId) {
      const userCodes = await this.prisma.kitCode.findMany({
        where: { userId },
        select: { kitId: true },
      });
      activatedKitIds = new Set(userCodes.map((c) => c.kitId));

      const doneProgress = await this.prisma.lessonProgress.findMany({
        where: { userId, status: LessonStatus.DONE },
        select: { lessonId: true },
      });
      doneLessonIds = new Set(doneProgress.map((p) => p.lessonId));
    }

    return kits.map((kit) => {
      const lessonsCount = kit.lessons.length;
      const base = {
        id: kit.id,
        slug: kit.slug,
        title: kit.title,
        description: kit.description,
        minAge: kit.minAge,
        mode: kit.mode,
        tool: kit.tool,
        difficulty: kit.difficulty,
        buyUrl: kit.buyUrl,
        coverUrl: kit.coverUrl,
        lessonsCount,
      };

      if (!userId) {
        return base;
      }

      const activated = activatedKitIds.has(kit.id);
      const completedCount = kit.lessons.filter((l) => doneLessonIds.has(l.id)).length;
      const progressPercent =
        lessonsCount > 0 ? Math.round((completedCount / lessonsCount) * 100) : 0;

      return {
        ...base,
        activated,
        progressPercent,
      };
    });
  }

  async getKitBySlug(slug: string, userId?: string) {
    const kit = await this.prisma.kit.findUnique({
      where: { slug },
      include: {
        lessons: {
          select: { id: true },
        },
      },
    });

    if (!kit) {
      throw new AppException('KIT_NOT_FOUND', 'Набор не найден', HttpStatus.NOT_FOUND);
    }

    const lessonsCount = kit.lessons.length;
    const base = {
      id: kit.id,
      slug: kit.slug,
      title: kit.title,
      description: kit.description,
      minAge: kit.minAge,
      mode: kit.mode,
      tool: kit.tool,
      difficulty: kit.difficulty,
      buyUrl: kit.buyUrl,
      coverUrl: kit.coverUrl,
      lessonsCount,
    };

    if (!userId) {
      return base;
    }

    const activatedCode = await this.prisma.kitCode.findFirst({
      where: { kitId: kit.id, userId },
    });
    const activated = !!activatedCode;

    const doneProgress = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: kit.lessons.map((l) => l.id) },
        status: LessonStatus.DONE,
      },
    });
    const completedCount = doneProgress.length;
    const progressPercent =
      lessonsCount > 0 ? Math.round((completedCount / lessonsCount) * 100) : 0;

    return {
      ...base,
      activated,
      progressPercent,
    };
  }

  async getKitLessons(slug: string, userId: string) {
    const kit = await this.prisma.kit.findUnique({
      where: { slug },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            skill: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    if (!kit) {
      throw new AppException('KIT_NOT_FOUND', 'Набор не найден', HttpStatus.NOT_FOUND);
    }

    const userActivation = await this.prisma.kitCode.findFirst({
      where: { kitId: kit.id, userId },
    });
    const isActivated = !!userActivation;

    if (!isActivated) {
      return kit.lessons.map((lesson) => ({
        id: lesson.id,
        order: lesson.order,
        title: lesson.title,
        status: 'LOCKED' as const,
        ...(lesson.skill && { skill: { id: lesson.skill.id, title: lesson.skill.title } }),
      }));
    }

    const progressList = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: kit.lessons.map((l) => l.id) },
      },
    });

    const progressMap = new Map(progressList.map((p) => [p.lessonId, p.status]));

    let foundCurrent = false;

    return kit.lessons.map((lesson) => {
      const status = progressMap.get(lesson.id);
      let calculatedStatus: 'DONE' | 'CURRENT' | 'LOCKED' = 'LOCKED';

      if (status === LessonStatus.DONE) {
        calculatedStatus = 'DONE';
      } else if (!foundCurrent) {
        calculatedStatus = 'CURRENT';
        foundCurrent = true;
      } else {
        calculatedStatus = 'LOCKED';
      }

      return {
        id: lesson.id,
        order: lesson.order,
        title: lesson.title,
        status: calculatedStatus,
        ...(lesson.skill && { skill: { id: lesson.skill.id, title: lesson.skill.title } }),
      };
    });
  }

  async activateKit(rawCode: string, userId: string) {
    const code = rawCode.trim().toUpperCase();

    return this.prisma.$transaction(async (tx) => {
      const kitCode = await tx.kitCode.findUnique({
        where: { code },
        include: {
          kit: {
            include: {
              lessons: { select: { id: true } },
            },
          },
        },
      });

      if (!kitCode) {
        throw new AppException('CODE_NOT_FOUND', 'Код не найден', HttpStatus.NOT_FOUND);
      }

      if (kitCode.userId !== null) {
        throw new AppException('CODE_ALREADY_USED', 'Код уже активирован', HttpStatus.CONFLICT);
      }

      const existingUserKit = await tx.kitCode.findFirst({
        where: {
          kitId: kitCode.kitId,
          userId,
        },
      });

      if (existingUserKit) {
        throw new AppException(
          'KIT_ALREADY_OWNED',
          'Этот набор уже есть у пользователя',
          HttpStatus.CONFLICT,
        );
      }

      await tx.kitCode.update({
        where: { id: kitCode.id },
        data: {
          userId,
          activatedAt: new Date(),
        },
      });

      const kit = kitCode.kit;
      return {
        kit: {
          id: kit.id,
          slug: kit.slug,
          title: kit.title,
          description: kit.description,
          minAge: kit.minAge,
          mode: kit.mode,
          tool: kit.tool,
          difficulty: kit.difficulty,
          buyUrl: kit.buyUrl,
          coverUrl: kit.coverUrl,
          lessonsCount: kit.lessons.length,
          activated: true,
          progressPercent: 0,
        },
      };
    });
  }

  async getUserKits(userId: string) {
    const userCodes = await this.prisma.kitCode.findMany({
      where: { userId },
      include: {
        kit: {
          include: {
            lessons: { select: { id: true } },
          },
        },
      },
    });

    const userProgress = await this.prisma.lessonProgress.findMany({
      where: { userId, status: LessonStatus.DONE },
      select: { lessonId: true },
    });
    const doneLessonIds = new Set(userProgress.map((p) => p.lessonId));

    return userCodes.map((c) => {
      const kit = c.kit;
      const totalLessons = kit.lessons.length;
      const completedCount = kit.lessons.filter((l) => doneLessonIds.has(l.id)).length;
      const progressPercent =
        totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      return {
        id: kit.id,
        slug: kit.slug,
        title: kit.title,
        description: kit.description,
        minAge: kit.minAge,
        mode: kit.mode,
        tool: kit.tool,
        difficulty: kit.difficulty,
        buyUrl: kit.buyUrl,
        coverUrl: kit.coverUrl,
        lessonsCount: totalLessons,
        activated: true,
        progressPercent,
      };
    });
  }
}
