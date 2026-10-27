import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StoreKitItemDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'ID набора' })
  kitId: string;

  @ApiProperty({ example: 'truck', description: 'Слаг набора' })
  slug: string;

  @ApiProperty({ example: 'Грузовичок', description: 'Название набора' })
  title: string;

  @ApiProperty({ example: true, description: 'Наличие в данном магазине' })
  inStock: boolean;
}

export class StoreResponseDto {
  @ApiProperty({ example: 'store-minsk-1', description: 'ID магазина' })
  id: string;

  @ApiProperty({ example: 'ОМА Боровляны', description: 'Название магазина' })
  name: string;

  @ApiProperty({ example: 'д. Боровляны, ул. 40 лет Победы, 24', description: 'Адрес магазина' })
  address: string;

  @ApiProperty({ example: 53.9984, description: 'Широта' })
  lat: number;

  @ApiProperty({ example: 27.6745, description: 'Долгота' })
  lng: number;

  @ApiProperty({ example: 'Пн-Вс: 08:00 - 22:00', description: 'Режим работы' })
  hours: string;

  @ApiProperty({ type: [StoreKitItemDto], description: 'Наличие наборов в магазине' })
  kits: StoreKitItemDto[];

  @ApiPropertyOptional({ example: 4.8, description: 'Расстояние в км (если переданы lat и lng пользователя)' })
  distanceKm?: number;
}
