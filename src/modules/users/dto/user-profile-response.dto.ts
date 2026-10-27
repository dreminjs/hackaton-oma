import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserKitProgressDto {
  @ApiProperty({ example: 'truck', description: 'Уникальный слаг набора' })
  slug: string;

  @ApiProperty({ example: 'Грузовичок', description: 'Название набора' })
  title: string;

  @ApiProperty({ example: 50, description: 'Процент завершения уроков набора (0-100)' })
  progressPercent: number;

  @ApiProperty({ example: false, description: 'Завершены ли все уроки набора' })
  completed: boolean;
}

export class UserSkillResponseDto {
  @ApiProperty({ example: 'skill-screwdriver', description: 'ID навыка' })
  id: string;

  @ApiProperty({ example: 'Отвёртка', description: 'Название навыка' })
  title: string;

  @ApiProperty({ example: '2026-10-27T16:20:00.000Z', description: 'Дата получения навыка' })
  earnedAt: Date;
}

export class UserProfileResponseDto {
  @ApiPropertyOptional({ example: 'Артём', description: 'Имя пользователя', nullable: true })
  name: string | null;

  @ApiPropertyOptional({ example: 7, description: 'Возраст пользователя', nullable: true })
  age: number | null;

  @ApiProperty({ example: 3, description: 'Количество заработанных звёзд' })
  stars: number;

  @ApiProperty({ example: 2, description: 'Количество выполненных уроков' })
  lessonsDone: number;

  @ApiProperty({ type: [UserKitProgressDto], description: 'Активированные наборы пользователя' })
  kits: UserKitProgressDto[];

  @ApiProperty({ type: [UserSkillResponseDto], description: 'Заработанные навыки' })
  skills: UserSkillResponseDto[];
}
