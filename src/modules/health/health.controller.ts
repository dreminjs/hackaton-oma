import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Проверка работоспособности сервиса' })
  @ApiOkResponse({ type: HealthResponseDto, description: 'Сервис работает штатно' })
  checkHealth(): HealthResponseDto {
    return { status: 'ok' };
  }
}
