import { Controller, Post, Get, Param, Body, Res } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import {
  ChatSessionResponseDto,
  ChatMessageResponseDto,
  ChatHistoryItemResponseDto,
} from './dto/chat-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { User } from '@prisma/client';
import { Response } from 'express';

@ApiTags('Chat Omik')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Создание сессии диалога с Омиком' })
  @ApiCreatedResponse({ type: ChatSessionResponseDto, description: 'Сессия создана' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Требуется авторизация' })
  async createSession(
    @CurrentUser() user: User,
    @Body() dto: CreateChatSessionDto,
  ): Promise<ChatSessionResponseDto> {
    return this.chatService.createSession(user.id, dto);
  }

  @Post('sessions/:id/messages')
  @ApiOperation({ summary: 'Отправка вопроса Омику и получение ответа' })
  @ApiCreatedResponse({ type: ChatMessageResponseDto, description: 'Ответ Омика' })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Ошибка длины текста (1-500 символов)' })
  @ApiForbiddenResponse({ type: ErrorResponseDto, description: 'Доступ к чужой сессии запрещен' })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Сессия не найдена' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Требуется авторизация' })
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: SendChatMessageDto,
  ): Promise<ChatMessageResponseDto> {
    return this.chatService.sendMessage(id, user.id, dto);
  }

  @Get('sessions/:id/messages')
  @ApiOperation({ summary: 'История сообщений в сессии чата' })
  @ApiOkResponse({ type: [ChatHistoryItemResponseDto], description: 'История сообщений' })
  @ApiForbiddenResponse({ type: ErrorResponseDto, description: 'Доступ к чужой сессии запрещен' })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Сессия не найдена' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Требуется авторизация' })
  async getSessionMessages(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<ChatHistoryItemResponseDto[]> {
    return this.chatService.getSessionMessages(id, user.id);
  }

  @Post('sessions/:id/messages/stream')
  @ApiOperation({ summary: 'SSE стриминг ответа Омика (text/event-stream)' })
  @ApiOkResponse({ description: 'Server-Sent Events стрим с событиями token и done' })
  @ApiForbiddenResponse({ type: ErrorResponseDto, description: 'Доступ к чужой сессии запрещен' })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Сессия не найдена' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Требуется авторизация' })
  async streamMessage(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: SendChatMessageDto,
    @Res() res: Response,
  ): Promise<void> {
    return this.chatService.streamMessage(id, user.id, dto, res);
  }
}
