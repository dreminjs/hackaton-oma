import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class StartLessonDto {
  @ApiPropertyOptional({ example: true, description: 'Флаг «рядом взрослый» (обязателен для наборов PARENT)' })
  @IsOptional()
  @IsBoolean({ message: 'adultConfirmed должен быть булевым значением' })
  adultConfirmed?: boolean;
}
