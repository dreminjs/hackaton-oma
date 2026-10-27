import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateLessonProgressDto {
  @ApiProperty({ example: 2, description: 'Номер пройденного шага урока (начиная с 1)' })
  @IsInt({ message: 'Номер шага должен быть целым числом' })
  @Min(1, { message: 'Номер шага должен быть больше или равен 1' })
  step: number;
}
