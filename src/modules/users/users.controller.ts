import { Controller, Get, Patch, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateMeDto } from './dto/update-me.dto';
import { UserSummaryDto } from '../auth/dto/session-response.dto';
import {
  UserProfileResponseDto,
  UserSkillResponseDto,
} from './dto/user-profile-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { User } from '@prisma/client';

@ApiTags('Users & Profile')
@ApiBearerAuth()
@Controller('me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Получение текущего пользователя' })
  @ApiOkResponse({ type: UserSummaryDto, description: 'Данные текущего пользователя' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Требуется авторизация' })
  async getMe(@CurrentUser() user: User): Promise<UserSummaryDto> {
    return this.usersService.getMe(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Обновление имени и возраста пользователя' })
  @ApiOkResponse({ type: UserSummaryDto, description: 'Обновленный пользователь' })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Ошибка валидации данных' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Требуется авторизация' })
  async updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateMeDto,
  ): Promise<UserSummaryDto> {
    return this.usersService.updateMe(user.id, dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Получение расширенного профиля с прогрессом и навыками' })
  @ApiOkResponse({ type: UserProfileResponseDto, description: 'Профиль пользователя' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Требуется авторизация' })
  async getProfile(@CurrentUser() user: User): Promise<UserProfileResponseDto> {
    return this.usersService.getProfile(user.id);
  }

  @Get('skills')
  @ApiOperation({ summary: 'Получение списка навыков пользователя' })
  @ApiOkResponse({ type: [UserSkillResponseDto], description: 'Список навыков' })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Требуется авторизация' })
  async getSkills(@CurrentUser() user: User): Promise<UserSkillResponseDto[]> {
    return this.usersService.getSkills(user.id);
  }
}
