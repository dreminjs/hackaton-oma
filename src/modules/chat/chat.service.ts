import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/exceptions/app.exception';
import { CreateChatSessionDto } from './dto/create-chat-session.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { ChatRole } from '@prisma/client';
import OpenAI from 'openai';
import { Response } from 'express';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly openai: OpenAI | null = null;
  private readonly dangerRegex = /(?:^|\s|\b|[.,!?;:])(газ|дым|искр|замыкан|ожог)/i;
  private readonly dangerResponse = 'Остановись и позови взрослого. Если опасно, звони 112';
  private readonly fallbackResponse = 'Омик задумался, спроси ещё раз через минуту';

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
        timeout: 10000,
      });
    }
  }

  async createSession(userId: string, dto: CreateChatSessionDto) {
    const session = await this.prisma.chatSession.create({
      data: {
        userId,
        kitId: dto.kitId || null,
        lessonId: dto.lessonId || null,
      },
    });

    return { sessionId: session.id };
  }

  private isDanger(text: string): boolean {
    return this.dangerRegex.test(text);
  }

  private buildSystemPrompt(user: { name?: string | null; age?: number | null }, kitTitle?: string, lessonTitle?: string): string {
    const userName = user.name || 'друг';
    const age = user.age || 7;
    const isUnder8 = age < 8;

    let prompt = `Ты — Омик, дружелюбный помощник детской мастерской ОМА. Обращайся к пользователю по имени (${userName}) и учитывай его возраст (${age} лет).`;

    if (isUnder8) {
      prompt += ' Отвечай короткими простыми фразами.';
    }

    prompt += ' Отвечай только про текущий набор, урок и безопасность работы с инструментами, на сторонние темы мягко возвращай к уроку. При опасных вопросах проси позвать взрослого. Не выдумывай того, чего нет в инструкции.';

    if (kitTitle) {
      prompt += ` Текущий набор: «${kitTitle}».`;
    }
    if (lessonTitle) {
      prompt += ` Текущий урок: «${lessonTitle}».`;
    }

    return prompt;
  }

  async sendMessage(sessionId: string, userId: string, dto: SendChatMessageDto) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
        kit: true,
        lesson: true,
      },
    });

    if (!session) {
      throw new AppException('SESSION_NOT_FOUND', 'Сессия чата не найдена', HttpStatus.NOT_FOUND);
    }

    if (session.userId !== userId) {
      throw new AppException('FORBIDDEN', 'Доступ к сессии запрещен', HttpStatus.FORBIDDEN);
    }

    const userText = dto.text.trim();

    // 1. Check danger words before calling Groq
    if (this.isDanger(userText)) {
      await this.prisma.chatMessage.createMany({
        data: [
          { sessionId, role: ChatRole.USER, content: userText },
          { sessionId, role: ChatRole.ASSISTANT, content: this.dangerResponse },
        ],
      });

      return { reply: this.dangerResponse };
    }

    // 2. Fetch last 10 messages for context
    const recentMessages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    recentMessages.reverse();

    const systemPrompt = this.buildSystemPrompt(
      session.user,
      session.kit?.title,
      session.lesson?.title,
    );

    const messagesForGroq: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map((m) => ({
        role: m.role === ChatRole.USER ? ('user' as const) : ('assistant' as const),
        content: m.content,
      })),
      { role: 'user', content: userText },
    ];

    let reply = this.fallbackResponse;

    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      try {
        const client = this.openai || new OpenAI({
          apiKey,
          baseURL: 'https://api.groq.com/openai/v1',
          timeout: 10000,
        });

        const completion = await client.chat.completions.create({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: messagesForGroq,
          temperature: 0.5,
          max_tokens: 300,
        });

        const groqReply = completion.choices[0]?.message?.content?.trim();
        if (groqReply) {
          reply = groqReply;
        }
      } catch (err: any) {
        this.logger.error(`Groq API error or timeout: ${err?.message || err}`);
        reply = this.fallbackResponse;
      }
    } else {
      this.logger.warn('GROQ_API_KEY is not configured, returning fallback response');
      reply = this.fallbackResponse;
    }

    await this.prisma.chatMessage.createMany({
      data: [
        { sessionId, role: ChatRole.USER, content: userText },
        { sessionId, role: ChatRole.ASSISTANT, content: reply },
      ],
    });

    return { reply };
  }

  async getSessionMessages(sessionId: string, userId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new AppException('SESSION_NOT_FOUND', 'Сессия чата не найдена', HttpStatus.NOT_FOUND);
    }

    if (session.userId !== userId) {
      throw new AppException('FORBIDDEN', 'Доступ к сессии запрещен', HttpStatus.FORBIDDEN);
    }

    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    }));
  }

  async streamMessage(sessionId: string, userId: string, dto: SendChatMessageDto, res: Response) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
        kit: true,
        lesson: true,
      },
    });

    if (!session) {
      throw new AppException('SESSION_NOT_FOUND', 'Сессия чата не найдена', HttpStatus.NOT_FOUND);
    }

    if (session.userId !== userId) {
      throw new AppException('FORBIDDEN', 'Доступ к сессии запрещен', HttpStatus.FORBIDDEN);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const userText = dto.text.trim();

    if (this.isDanger(userText)) {
      await this.prisma.chatMessage.createMany({
        data: [
          { sessionId, role: ChatRole.USER, content: userText },
          { sessionId, role: ChatRole.ASSISTANT, content: this.dangerResponse },
        ],
      });

      res.write(`event: token\ndata: ${JSON.stringify({ token: this.dangerResponse })}\n\n`);
      res.write(`event: done\ndata: ${JSON.stringify({ reply: this.dangerResponse })}\n\n`);
      res.end();
      return;
    }

    const recentMessages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    recentMessages.reverse();

    const systemPrompt = this.buildSystemPrompt(
      session.user,
      session.kit?.title,
      session.lesson?.title,
    );

    const messagesForGroq: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map((m) => ({
        role: m.role === ChatRole.USER ? ('user' as const) : ('assistant' as const),
        content: m.content,
      })),
      { role: 'user', content: userText },
    ];

    let fullReply = '';
    const apiKey = process.env.GROQ_API_KEY;

    if (apiKey) {
      try {
        const client = this.openai || new OpenAI({
          apiKey,
          baseURL: 'https://api.groq.com/openai/v1',
          timeout: 10000,
        });

        const stream = await client.chat.completions.create({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: messagesForGroq,
          temperature: 0.5,
          max_tokens: 300,
          stream: true,
        });

        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content || '';
          if (token) {
            fullReply += token;
            res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
          }
        }
      } catch (err: any) {
        this.logger.error(`Groq streaming error: ${err?.message || err}`);
        if (!fullReply) {
          fullReply = this.fallbackResponse;
          res.write(`event: token\ndata: ${JSON.stringify({ token: this.fallbackResponse })}\n\n`);
        }
      }
    } else {
      fullReply = this.fallbackResponse;
      res.write(`event: token\ndata: ${JSON.stringify({ token: this.fallbackResponse })}\n\n`);
    }

    await this.prisma.chatMessage.createMany({
      data: [
        { sessionId, role: ChatRole.USER, content: userText },
        { sessionId, role: ChatRole.ASSISTANT, content: fullReply },
      ],
    });

    res.write(`event: done\ndata: ${JSON.stringify({ reply: fullReply })}\n\n`);
    res.end();
  }
}
