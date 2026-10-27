import { Controller, Get, Post, Param, Body } from '@nestjs/common';
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
import { LessonsService } from './lessons.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StartLessonDto } from './dto/start-lesson.dto';
import { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import { LessonDetailResponseDto } from './dto/lesson-detail-response.dto';
import { StartLessonResponseDto } from './dto/start-lesson-response.dto';
import { CompleteLessonResponseDto } from './dto/complete-lesson-response.dto';
import { UpdateProgressResponseDto } from './dto/update-progress-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { User } from '@prisma/client';

@ApiTags('Lessons & Progress')
@ApiBearerAuth()
@Controller()
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get('lessons/:id')
  @ApiOperation({ summary: 'Получение урока с пошаговой инструкцией' })
  @ApiOkResponse({ type: LessonDetailResponseDto, description: 'Инструкция урока' })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'Урок заблокирован или набор не активирован (LESSON_LOCKED)',
  })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Урок не найден (LESSON_NOT_FOUND)' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Требуется авторизация' })
  async getLesson(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<LessonDetailResponseDto> {
    return this.lessonsService.getLesson(id, user.id);
  }

  @Post('me/lessons/:id/start')
  @ApiOperation({ summary: 'Старт прохождения урока' })
  @ApiCreatedResponse({ type: StartLessonResponseDto, description: 'Урок начат' })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Требуется подтверждение взрослого (ADULT_CONFIRMATION_REQUIRED)',
  })
  @ApiForbiddenResponse({ type: ErrorResponseDto, description: 'Урок заблокирован (LESSON_LOCKED)' })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Урок не найден' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Требуется авторизация' })
  async startLesson(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: StartLessonDto,
  ): Promise<StartLessonResponseDto> {
    return this.lessonsService.startLesson(id, user.id, dto);
  }

  @Post('me/lessons/:id/progress')
  @ApiOperation({ summary: 'Фиксация прогресса текущего шага урока' })
  @ApiCreatedResponse({ type: UpdateProgressResponseDto, description: 'Шаг зафиксирован' })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Урок ещё не начат (LESSON_NOT_STARTED)' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Требуется авторизация' })
  async updateProgress(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateLessonProgressDto,
  ): Promise<UpdateProgressResponseDto> {
    return this.lessonsService.updateProgress(id, user.id, dto);
  }

  @Post('me/lessons/:id/complete')
  @ApiOperation({ summary: 'Завершение урока: начисление звезды и выдача навыка' })
  @ApiCreatedResponse({ type: CompleteLessonResponseDto, description: 'Урок успешно завершён' })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Урок не начат (LESSON_NOT_STARTED) или не завершены шаги (LESSON_NOT_FINISHED)',
  })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Требуется авторизация' })
  async completeLesson(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<CompleteLessonResponseDto> {
    return this.lessonsService.completeLesson(id, user.id);
  }
}
