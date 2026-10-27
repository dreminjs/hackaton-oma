import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 'VALIDATION_ERROR', description: 'Уникальный код ошибки' })
  code: string;

  @ApiProperty({ example: 'Некорректные данные запроса', description: 'Понятное сообщение об ошибке' })
  message: string;
}
