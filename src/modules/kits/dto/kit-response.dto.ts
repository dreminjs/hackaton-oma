import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KitMode } from '@prisma/client';

export class KitResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID набора' })
  id: string;

  @ApiProperty({ example: 'truck', description: 'Слаг набора' })
  slug: string;

  @ApiProperty({ example: 'Грузовичок', description: 'Название набора' })
  title: string;

  @ApiProperty({ example: 'Собери свой первый деревянный грузовичок...', description: 'Описание набора' })
  description: string;

  @ApiProperty({ example: 6, description: 'Минимальный рекомендуемый возраст' })
  minAge: number;

  @ApiProperty({ enum: KitMode, example: KitMode.SOLO, description: 'Режим: SOLO (самостоятельно) или PARENT (с родителем)' })
  mode: KitMode;

  @ApiProperty({ example: 'Отвёртка', description: 'Основной инструмент' })
  tool: string;

  @ApiProperty({ example: 1, description: 'Сложность от 1 до 3' })
  difficulty: number;

  @ApiProperty({ example: 'https://oma.by/catalog/kit-truck', description: 'Ссылка на покупку' })
  buyUrl: string;

  @ApiPropertyOptional({ example: 'https://oma.by/images/kits/truck.png', description: 'URL обложки', nullable: true })
  coverUrl: string | null;

  @ApiProperty({ example: 2, description: 'Общее количество уроков в наборе' })
  lessonsCount: number;

  @ApiPropertyOptional({ example: true, description: 'Активирован ли набор пользователем (если передан токен)' })
  activated?: boolean;

  @ApiPropertyOptional({ example: 50, description: 'Процент завершения уроков набора (если передан токен)' })
  progressPercent?: number;
}

export class ActivationResponseDto {
  @ApiProperty({ type: KitResponseDto, description: 'Активированный набор' })
  kit: KitResponseDto;
}
