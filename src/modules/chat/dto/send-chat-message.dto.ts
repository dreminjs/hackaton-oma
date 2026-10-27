import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class SendChatMessageDto {
  @ApiProperty({ example: 'Как правильно держать молоток?', description: 'Текст сообщения (от 1 до 500 символов)' })
  @IsNotEmpty({ message: 'Текст сообщения не может быть пустым' })
  @IsString({ message: 'Текст сообщения должен быть строкой' })
  @Length(1, 500, { message: 'Длина сообщения должна быть от 1 до 500 символов' })
  text: string;
}
