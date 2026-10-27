import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { LessonStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    return {
      id: user.id,
      name: user.name,
      age: user.age,
      stars: user.stars,
      createdAt: user.createdAt,
    };
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.age !== undefined && { age: dto.age }),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      age: updated.age,
      stars: updated.stars,
      createdAt: updated.createdAt,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const lessonsDone = await this.prisma.lessonProgress.count({
      where: {
        userId,
        status: LessonStatus.DONE,
      },
    });

    // Activated kits
    const activatedCodes = await this.prisma.kitCode.findMany({
      where: { userId },
      include: {
        kit: {
          include: {
            lessons: {
              select: { id: true },
            },
          },
        },
      },
    });

    const userProgress = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        status: LessonStatus.DONE,
      },
      select: { lessonId: true },
    });
    const doneLessonIds = new Set(userProgress.map((p) => p.lessonId));

    const kits = activatedCodes.map((c) => {
      const kit = c.kit;
      const totalLessons = kit.lessons.length;
      const completedCount = kit.lessons.filter((l) => doneLessonIds.has(l.id)).length;
      const progressPercent =
        totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      return {
        slug: kit.slug,
        title: kit.title,
        progressPercent,
        completed: totalLessons > 0 && completedCount === totalLessons,
      };
    });

    const userSkills = await this.prisma.userSkill.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { earnedAt: 'asc' },
    });

    const skills = userSkills.map((us) => ({
      id: us.skill.id,
      title: us.skill.title,
      earnedAt: us.earnedAt,
    }));

    return {
      name: user.name,
      age: user.age,
      stars: user.stars,
      lessonsDone,
      kits,
      skills,
    };
  }

  async getSkills(userId: string) {
    const userSkills = await this.prisma.userSkill.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { earnedAt: 'asc' },
    });

    return userSkills.map((us) => ({
      id: us.skill.id,
      title: us.skill.title,
      earnedAt: us.earnedAt,
    }));
  }
}
