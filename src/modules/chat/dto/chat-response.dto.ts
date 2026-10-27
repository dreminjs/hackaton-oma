import { ApiProperty } from '@nestjs/swagger';
import { ChatRole } from '@prisma/client';

export class ChatSessionResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID созданной сессии чата' })
  sessionId: string;
}

export class ChatMessageResponseDto {
  @ApiProperty({
    example: 'Привет! Чтобы закрутить винтик, держи отвёртку ровно и крути по часовой стрелке!',
    description: 'Ответ помощника Омика',
  })
  reply: string;
}

export class ChatHistoryItemResponseDto {
  @ApiProperty({ example: 'msg-1234', description: 'ID сообщения' })
  id: string;

  @ApiProperty({ enum: ChatRole, example: ChatRole.USER, description: 'Роль отправителя (USER или ASSISTANT)' })
  role: ChatRole;

  @ApiProperty({ example: 'Как закрутить винтик?', description: 'Текст сообщения' })
  content: string;

  @ApiProperty({ example: '2026-10-27T16:15:00.000Z', description: 'Время отправки' })
  createdAt: Date;
}
