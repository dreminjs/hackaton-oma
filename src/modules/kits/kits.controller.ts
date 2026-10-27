import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { KitsService } from './kits.service';
import { OptionalAuth } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FilterKitsDto } from './dto/filter-kits.dto';
import { ActivateKitDto } from './dto/activate-kit.dto';
import { KitResponseDto, ActivationResponseDto } from './dto/kit-response.dto';
import { KitLessonResponseDto } from './dto/kit-lesson-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { User } from '@prisma/client';

@ApiTags('Kits & Activations')
@Controller()
export class KitsController {
  constructor(private readonly kitsService: KitsService) {}

  @OptionalAuth()
  @ApiBearerAuth()
  @Get('kits')
  @ApiOperation({ summary: 'Каталог наборов с фильтрами по возрасту, сложности и режиму' })
  @ApiOkResponse({
    type: [KitResponseDto],
    description: 'Список наборов (с полями activated и progressPercent, если передан токен)',
  })
  async getKits(
    @Query() dto: FilterKitsDto,
    @CurrentUser() user?: User,
  ): Promise<KitResponseDto[]> {
    return this.kitsService.getKits(dto, user?.id);
  }

  @OptionalAuth()
  @ApiBearerAuth()
  @Get('kits/:slug')
  @ApiOperation({ summary: 'Получение детальной информации о наборе по слагу' })
  @ApiOkResponse({ type: KitResponseDto, description: 'Карточка набора' })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Набор не найден' })
  async getKitBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user?: User,
  ): Promise<KitResponseDto> {
    return this.kitsService.getKitBySlug(slug, user?.id);
  }

  @ApiBearerAuth()
  @Get('kits/:slug/lessons')
  @ApiOperation({ summary: 'Список уроков набора с динамическим статусом (DONE, CURRENT, LOCKED)' })
  @ApiOkResponse({ type: [KitLessonResponseDto], description: 'Уроки набора со статусами' })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Набор не найден' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Требуется авторизация' })
  async getKitLessons(
    @Param('slug') slug: string,
    @CurrentUser() user: User,
  ): Promise<KitLessonResponseDto[]> {
    return this.kitsService.getKitLessons(slug, user.id);
  }

  @ApiBearerAuth()
  @Post('activations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Активация набора по промокоду из коробки' })
  @ApiCreatedResponse({ type: ActivationResponseDto, description: 'Набор успешно активирован' })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Код не найден (CODE_NOT_FOUND)' })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Код уже использован (CODE_ALREADY_USED) или набор уже есть (KIT_ALREADY_OWNED)',
  })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Требуется авторизация' })
  async activateKit(
    @Body() dto: ActivateKitDto,
    @CurrentUser() user: User,
  ): Promise<ActivationResponseDto> {
    return this.kitsService.activateKit(dto.code, user.id);
  }

  @ApiBearerAuth()
  @Get('me/kits')
  @ApiOperation({ summary: 'Список наборов текущего пользователя' })
  @ApiOkResponse({ type: [KitResponseDto], description: 'Наборы пользователя с процентом прохождения' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Требуется авторизация' })
  async getMyKits(@CurrentUser() user: User): Promise<KitResponseDto[]> {
    return this.kitsService.getUserKits(user.id);
  }
}
