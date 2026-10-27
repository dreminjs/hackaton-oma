import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { FilterStoresDto } from './dto/filter-stores.dto';
import { StoreResponseDto } from './dto/store-response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Stores')
@Public()
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({ summary: 'Список магазинов с фильтром по наличию набора и сортировкой по расстоянию' })
  @ApiOkResponse({ type: [StoreResponseDto], description: 'Список магазинов' })
  async getStores(@Query() dto: FilterStoresDto): Promise<StoreResponseDto[]> {
    return this.storesService.getStores(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получение магазина по ID' })
  @ApiOkResponse({ type: StoreResponseDto, description: 'Карточка магазина' })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'Магазин не найден (STORE_NOT_FOUND)' })
  async getStoreById(@Param('id') id: string): Promise<StoreResponseDto> {
    return this.storesService.getStoreById(id);
  }
}
