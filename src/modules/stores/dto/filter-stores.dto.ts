import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterStoresDto {
  @ApiPropertyOptional({ example: 'nest', description: 'Фильтр по слагу набора (только магазины в наличии)' })
  @IsOptional()
  @IsString()
  kit?: string;

  @ApiPropertyOptional({ example: '53.9006', description: 'Широта местоположения пользователя для сортировки по расстоянию' })
  @IsOptional()
  @IsString()
  lat?: string;

  @ApiPropertyOptional({ example: '27.5590', description: 'Долгота местоположения пользователя для сортировки по расстоянию' })
  @IsOptional()
  @IsString()
  lng?: string;
}
