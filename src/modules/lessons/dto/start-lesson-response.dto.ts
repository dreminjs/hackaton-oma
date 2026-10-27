import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonStatus } from '@prisma/client';

export class LessonProgressInfoDto {
  @ApiProperty({ example: 'prog-1234-5678', description: 'ID записи прогресса' })
  id: string;

  @ApiProperty({ example: 'lesson-truck-1', description: 'ID урока' })
  lessonId: string;

  @ApiProperty({ enum: LessonStatus, example: LessonStatus.IN_PROGRESS, description: 'Статус прохождения' })
  status: LessonStatus;

  @ApiProperty({ example: '2026-10-27T16:10:00.000Z', description: 'Время старта урока' })
  startedAt: Date;

  @ApiPropertyOptional({ example: '2026-10-27T16:10:00.000Z', description: 'Время подтверждения родителем', nullable: true })
  adultConfirmedAt?: Date | null;
}

export class StartLessonResponseDto {
  @ApiProperty({ example: true, description: 'Флаг успешности запуска' })
  success: boolean;

  @ApiProperty({ type: LessonProgressInfoDto, description: 'Информация о созданном прогрессе' })
  progress: LessonProgressInfoDto;
}
