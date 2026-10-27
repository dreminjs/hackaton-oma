import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterStoresDto } from './dto/filter-stores.dto';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  async getStores(dto: FilterStoresDto) {
    const stores = await this.prisma.store.findMany({
      include: {
        kits: {
          include: {
            kit: {
              select: { id: true, slug: true, title: true },
            },
          },
        },
      },
    });

    let results = stores.map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      hours: s.hours,
      kits: s.kits.map((sk) => ({
        kitId: sk.kitId,
        slug: sk.kit.slug,
        title: sk.kit.title,
        inStock: sk.inStock,
      })),
      distanceKm: undefined as number | undefined,
    }));

    if (dto.kit) {
      results = results.filter((s) =>
        s.kits.some((k) => k.slug === dto.kit && k.inStock),
      );
    }

    if (dto.lat && dto.lng) {
      const userLat = parseFloat(dto.lat);
      const userLng = parseFloat(dto.lng);

      if (!isNaN(userLat) && !isNaN(userLng)) {
        results.forEach((s) => {
          s.distanceKm = this.haversineDistance(userLat, userLng, s.lat, s.lng);
        });

        results.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
      }
    }

    return results;
  }

  async getStoreById(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        kits: {
          include: {
            kit: {
              select: { id: true, slug: true, title: true },
            },
          },
        },
      },
    });

    if (!store) {
      throw new AppException('STORE_NOT_FOUND', 'Магазин не найден', HttpStatus.NOT_FOUND);
    }

    return {
      id: store.id,
      name: store.name,
      address: store.address,
      lat: store.lat,
      lng: store.lng,
      hours: store.hours,
      kits: store.kits.map((sk) => ({
        kitId: sk.kitId,
        slug: sk.kit.slug,
        title: sk.kit.title,
        inStock: sk.inStock,
      })),
    };
  }
}
