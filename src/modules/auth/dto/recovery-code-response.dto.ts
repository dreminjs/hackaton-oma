import { ApiProperty } from '@nestjs/swagger';

export class RecoveryCodeResponseDto {
  @ApiProperty({ example: 'A8B2C3D4', description: '8-значный одноразовый код восстановления сессии' })
  code: string;
}
