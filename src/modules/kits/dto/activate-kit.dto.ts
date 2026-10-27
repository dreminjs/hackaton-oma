import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ActivateKitDto {
  @ApiProperty({ example: 'OMA-TRUCK-001', description: 'Уникальный промокод из коробки набора' })
  @IsNotEmpty({ message: 'Код набора обязателен' })
  @IsString({ message: 'Код набора должен быть строкой' })
  code: string;
}
