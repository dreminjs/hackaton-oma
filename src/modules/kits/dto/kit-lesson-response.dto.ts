import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SkillInfoResponseDto {
  @ApiProperty({ example: 'skill-screwdriver', description: 'ID навыка' })
  id: string;

  @ApiProperty({ example: 'Отвёртка', description: 'Название навыка' })
  title: string;
}

export class KitLessonResponseDto {
  @ApiProperty({ example: 'lesson-truck-1', description: 'ID урока' })
  id: string;

  @ApiProperty({ example: 1, description: 'Порядковый номер урока в наборе' })
  order: number;

  @ApiProperty({ example: 'Знакомство с отвёрткой', description: 'Название урока' })
  title: string;

  @ApiProperty({
    enum: ['DONE', 'CURRENT', 'LOCKED'],
    example: 'CURRENT',
    description: 'Вычисленный статус урока: DONE (пройден), CURRENT (доступен для прохождения), LOCKED (заблокирован)',
  })
  status: 'DONE' | 'CURRENT' | 'LOCKED';

  @ApiPropertyOptional({ type: SkillInfoResponseDto, description: 'Навык, выдаваемый за урок' })
  skill?: SkillInfoResponseDto;
}
