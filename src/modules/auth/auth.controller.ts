import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RestoreSessionDto } from './dto/restore-session.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { RecoveryCodeResponseDto } from './dto/recovery-code-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { User } from '@prisma/client';

@ApiTags('Session & Auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('session')
  @ApiOperation({ summary: 'Создание новой анонимной сессии' })
  @ApiCreatedResponse({
    type: SessionResponseDto,
    description: 'Сессия создана, токен выпущен',
  })
  async createSession(): Promise<SessionResponseDto> {
    return this.authService.createSession();
  }

  @Public()
  @Post('session/restore')
  @ApiOperation({ summary: 'Восстановление сессии по одноразовому коду' })
  @ApiCreatedResponse({
    type: SessionResponseDto,
    description: 'Сессия успешно восстановлена',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Код восстановления не найден',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Ошибка валидации кода',
  })
  async restoreSession(@Body() dto: RestoreSessionDto): Promise<SessionResponseDto> {
    return this.authService.restoreSession(dto.code);
  }

  @ApiBearerAuth()
  @Post('me/recovery-code')
  @ApiOperation({ summary: 'Генерация 8-значного кода восстановления' })
  @ApiCreatedResponse({
    type: RecoveryCodeResponseDto,
    description: 'Код восстановления сгенерирован',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Требуется авторизация',
  })
  async createRecoveryCode(@CurrentUser() user: User): Promise<RecoveryCodeResponseDto> {
    return this.authService.createRecoveryCode(user.id);
  }
}
