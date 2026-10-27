import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/exceptions/app.exception';
import { KitMode, LessonStatus } from '@prisma/client';
import { StartLessonDto } from './dto/start-lesson.dto';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkLessonStatus(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        kit: {
          include: {
            lessons: { orderBy: { order: 'asc' } },
          },
        },
        skill: true,
        steps: { orderBy: { order: 'asc' } },
      },
    });

    if (!lesson) {
      throw new AppException('LESSON_NOT_FOUND', 'Урок не найден', HttpStatus.NOT_FOUND);
    }

    const activation = await this.prisma.kitCode.findFirst({
      where: { kitId: lesson.kitId, userId },
    });

    if (!activation) {
      throw new AppException('LESSON_LOCKED', 'Набор не активирован', HttpStatus.FORBIDDEN);
    }

    const progressList = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: lesson.kit.lessons.map((l) => l.id) },
      },
    });

    const progressMap = new Map(progressList.map((p) => [p.lessonId, p.status]));

    let foundCurrent = false;
    let targetStatus: 'DONE' | 'CURRENT' | 'LOCKED' = 'LOCKED';

    for (const l of lesson.kit.lessons) {
      const st = progressMap.get(l.id);
      let status: 'DONE' | 'CURRENT' | 'LOCKED';

      if (st === LessonStatus.DONE) {
        status = 'DONE';
      } else if (!foundCurrent) {
        status = 'CURRENT';
        foundCurrent = true;
      } else {
        status = 'LOCKED';
      }

      if (l.id === lessonId) {
        targetStatus = status;
        break;
      }
    }

    return { lesson, activation, targetStatus, progress: progressList.find((p) => p.lessonId === lessonId) };
  }

  async getLesson(lessonId: string, userId: string) {
    const { lesson, targetStatus } = await this.checkLessonStatus(lessonId, userId);

    if (targetStatus === 'LOCKED') {
      throw new AppException('LESSON_LOCKED', 'Урок заблокирован', HttpStatus.FORBIDDEN);
    }

    return {
      id: lesson.id,
      kitId: lesson.kitId,
      order: lesson.order,
      title: lesson.title,
      skill: lesson.skill ? { id: lesson.skill.id, title: lesson.skill.title } : null,
      steps: lesson.steps.map((s) => ({
        id: s.id,
        order: s.order,
        text: s.text,
        imageUrl: s.imageUrl,
        videoUrl: s.videoUrl,
      })),
    };
  }

  async startLesson(lessonId: string, userId: string, dto: StartLessonDto) {
    const { lesson, targetStatus, progress } = await this.checkLessonStatus(lessonId, userId);

    if (targetStatus === 'LOCKED' && !progress) {
      throw new AppException('LESSON_LOCKED', 'Урок заблокирован', HttpStatus.FORBIDDEN);
    }

    if (lesson.kit.mode === KitMode.PARENT && dto.adultConfirmed !== true) {
      throw new AppException(
        'ADULT_CONFIRMATION_REQUIRED',
        'Для набора требуется подтверждение взрослого',
        HttpStatus.BAD_REQUEST,
      );
    }

    const adultConfirmedAt =
      lesson.kit.mode === KitMode.PARENT && dto.adultConfirmed ? new Date() : undefined;

    const savedProgress = await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      update: {
        ...(adultConfirmedAt && { adultConfirmedAt }),
      },
      create: {
        userId,
        lessonId,
        status: LessonStatus.IN_PROGRESS,
        startedAt: new Date(),
        adultConfirmedAt,
      },
    });

    return {
      success: true,
      progress: {
        id: savedProgress.id,
        lessonId: savedProgress.lessonId,
        status: savedProgress.status,
        startedAt: savedProgress.startedAt,
        adultConfirmedAt: savedProgress.adultConfirmedAt,
      },
    };
  }

  async updateProgress(lessonId: string, userId: string, dto: UpdateLessonProgressDto) {
    const existing = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    if (!existing) {
      throw new AppException('LESSON_NOT_STARTED', 'Урок ещё не начат', HttpStatus.BAD_REQUEST);
    }

    const updated = await this.prisma.lessonProgress.update({
      where: { userId_lessonId: { userId, lessonId } },
      data: {
        maxStepReached: Math.max(existing.maxStepReached, dto.step),
      },
    });

    return {
      success: true,
      maxStepReached: updated.maxStepReached,
    };
  }

  async completeLesson(lessonId: string, userId: string) {
    const existing = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      include: {
        lesson: {
          include: {
            kit: true,
            skill: true,
            steps: true,
          },
        },
        user: true,
      },
    });

    if (!existing) {
      throw new AppException('LESSON_NOT_STARTED', 'Урок ещё не начат', HttpStatus.BAD_REQUEST);
    }

    const lesson = existing.lesson;

    // Check next lesson in order
    const nextLesson = await this.prisma.lesson.findFirst({
      where: {
        kitId: lesson.kitId,
        order: { gt: lesson.order },
      },
      orderBy: { order: 'asc' },
    });

    // If already DONE, idempotent response
    if (existing.status === LessonStatus.DONE) {
      const awardedSkill = lesson.skill
        ? { id: lesson.skill.id, title: lesson.skill.title }
        : undefined;

      return {
        stars: existing.user.stars,
        ...(awardedSkill && { skillAwarded: awardedSkill }),
        nextLessonId: nextLesson ? nextLesson.id : null,
      };
    }

    // Server check if step tracking was used and not finished
    if (existing.maxStepReached > 0 && lesson.steps.length > 0) {
      const totalSteps = lesson.steps.length;
      if (existing.maxStepReached < totalSteps) {
        throw new AppException(
          'LESSON_NOT_FINISHED',
          'Урок ещё не завершён всеми шагами',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark lesson progress as DONE
      await tx.lessonProgress.update({
        where: { id: existing.id },
        data: {
          status: LessonStatus.DONE,
          completedAt: new Date(),
        },
      });

      // 2. Increment user's stars
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          stars: { increment: 1 },
        },
      });

      // 3. Award skill if attached to lesson
      let skillAwarded: { id: string; title: string } | undefined = undefined;
      if (lesson.skill) {
        const existingSkill = await tx.userSkill.findUnique({
          where: {
            userId_skillId: {
              userId,
              skillId: lesson.skill.id,
            },
          },
        });

        if (!existingSkill) {
          await tx.userSkill.create({
            data: {
              userId,
              skillId: lesson.skill.id,
              earnedAt: new Date(),
            },
          });
        }

        skillAwarded = {
          id: lesson.skill.id,
          title: lesson.skill.title,
        };
      }

      return {
        stars: updatedUser.stars,
        ...(skillAwarded && { skillAwarded }),
        nextLessonId: nextLesson ? nextLesson.id : null,
      };
    });
  }
}
