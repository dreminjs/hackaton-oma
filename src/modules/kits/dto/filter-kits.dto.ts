import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumberString, IsOptional } from 'class-validator';
import { KitMode } from '@prisma/client';

export class FilterKitsDto {
  @ApiPropertyOptional({ example: '7', description: 'Фильтр по возрасту (minAge <= age)' })
  @IsOptional()
  @IsNumberString({}, { message: 'Возраст должен быть числом' })
  age?: string;

  @ApiPropertyOptional({ example: '1', description: 'Фильтр по сложности (1-3)' })
  @IsOptional()
  @IsNumberString({}, { message: 'Сложность должна быть числом' })
  difficulty?: string;

  @ApiPropertyOptional({ enum: KitMode, example: KitMode.SOLO, description: 'Фильтр по режиму (SOLO или PARENT)' })
  @IsOptional()
  @IsEnum(KitMode, { message: 'Недопустимый режим набора' })
  mode?: KitMode;
}
