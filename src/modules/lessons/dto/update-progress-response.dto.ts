import { ApiProperty } from '@nestjs/swagger';

export class UpdateProgressResponseDto {
  @ApiProperty({ example: true, description: 'Флаг успешности фиксации прогресса' })
  success: boolean;

  @ApiProperty({ example: 3, description: 'Максимальный достигнутый шаг' })
  maxStepReached: number;
}
