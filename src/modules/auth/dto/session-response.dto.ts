import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserSummaryDto {
  @ApiProperty({ example: '85f67a21-42ba-4dc3-8ce0-5c14101e48bc', description: 'ID пользователя' })
  id: string;

  @ApiPropertyOptional({ example: 'Артём', description: 'Имя пользователя', nullable: true })
  name: string | null;

  @ApiPropertyOptional({ example: 7, description: 'Возраст пользователя', nullable: true })
  age: number | null;

  @ApiProperty({ example: 0, description: 'Количество заработанных звёзд' })
  stars: number;

  @ApiProperty({ example: '2026-10-27T16:00:00.000Z', description: 'Дата создания пользователя' })
  createdAt: Date;
}

export class SessionResponseDto {
  @ApiProperty({ description: 'JWT токен для авторизации' })
  token: string;

  @ApiProperty({ type: UserSummaryDto, description: 'Информация о пользователе' })
  user: UserSummaryDto;
}
