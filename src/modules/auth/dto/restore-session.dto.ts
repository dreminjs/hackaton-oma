import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class RestoreSessionDto {
  @ApiProperty({ example: 'A8B2C3D4', description: '8-значный код восстановления' })
  @IsNotEmpty({ message: 'Код восстановления обязателен' })
  @IsString({ message: 'Код должен быть строкой' })
  @Length(8, 8, { message: 'Код восстановления должен состоять из 8 символов' })
  code: string;
}
