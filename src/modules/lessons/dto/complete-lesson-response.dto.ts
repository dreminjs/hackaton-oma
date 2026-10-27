import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SkillInfoResponseDto } from '../../kits/dto/kit-lesson-response.dto';

export class CompleteLessonResponseDto {
  @ApiProperty({ example: 1, description: 'Обновленное общее количество звёзд' })
  stars: number;

  @ApiPropertyOptional({ type: SkillInfoResponseDto, description: 'Выданный навык (если урок ключевой)' })
  skillAwarded?: SkillInfoResponseDto;

  @ApiPropertyOptional({ example: 'lesson-truck-2', description: 'ID следующего урока (null, если был последним)', nullable: true })
  nextLessonId?: string | null;
}
