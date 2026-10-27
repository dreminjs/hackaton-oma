import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SkillInfoResponseDto } from '../../kits/dto/kit-lesson-response.dto';

export class LessonStepResponseDto {
  @ApiProperty({ example: 'step-truck-1-1', description: 'ID шага' })
  id: string;

  @ApiProperty({ example: 1, description: 'Порядковый номер шага' })
  order: number;

  @ApiProperty({ example: 'Возьми отвёртку за рукоятку...', description: 'Текст инструкции шага' })
  text: string;

  @ApiPropertyOptional({ example: 'https://oma.by/img/steps/step1.jpg', description: 'URL изображения', nullable: true })
  imageUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://oma.by/video/steps/step1.mp4', description: 'URL видео', nullable: true })
  videoUrl?: string | null;
}

export class LessonDetailResponseDto {
  @ApiProperty({ example: 'lesson-truck-1', description: 'ID урока' })
  id: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID набора' })
  kitId: string;

  @ApiProperty({ example: 1, description: 'Порядковый номер урока' })
  order: number;

  @ApiProperty({ example: 'Знакомство с отвёрткой', description: 'Название урока' })
  title: string;

  @ApiPropertyOptional({ type: SkillInfoResponseDto, description: 'Навык, привязанный к уроку', nullable: true })
  skill: SkillInfoResponseDto | null;

  @ApiProperty({ type: [LessonStepResponseDto], description: 'Шаги урока в порядке прохождения' })
  steps: LessonStepResponseDto[];
}
