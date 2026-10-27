import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'Артём', description: 'Имя пользователя (от 1 до 30 символов)' })
  @IsOptional()
  @IsString({ message: 'Имя должно быть строкой' })
  @Length(1, 30, { message: 'Имя должно быть от 1 до 30 символов' })
  name?: string;

  @ApiPropertyOptional({ example: 7, description: 'Возраст пользователя (от 3 до 99 лет)' })
  @IsOptional()
  @IsInt({ message: 'Возраст должен быть целым числом' })
  @Min(3, { message: 'Возраст должен быть от 3 лет' })
  @Max(99, { message: 'Возраст не должен превышать 99 лет' })
  age?: number;
}
