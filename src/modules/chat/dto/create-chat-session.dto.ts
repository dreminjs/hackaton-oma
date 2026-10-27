import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateChatSessionDto {
  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID набора (для контекста чата)' })
  @IsOptional()
  @IsString({ message: 'kitId должен быть строкой' })
  kitId?: string;

  @ApiPropertyOptional({ example: 'lesson-truck-1', description: 'ID урока (для контекста чата)' })
  @IsOptional()
  @IsString({ message: 'lessonId должен быть строкой' })
  lessonId?: string;
}
