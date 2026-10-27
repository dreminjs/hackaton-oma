import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/exceptions/app.exception';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async createSession() {
    const user = await this.prisma.user.create({
      data: {
        stars: 0,
      },
    });

    const token = await this.jwtService.signAsync({ userId: user.id });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        age: user.age,
        stars: user.stars,
        createdAt: user.createdAt,
      },
    };
  }

  async createRecoveryCode(userId: string) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();

    await this.prisma.user.update({
      where: { id: userId },
      data: { recoveryCode: code },
    });

    return { code };
  }

  async restoreSession(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    const user = await this.prisma.user.findUnique({
      where: { recoveryCode: normalizedCode },
    });

    if (!user) {
      throw new AppException('CODE_NOT_FOUND', 'Код восстановления не найден', HttpStatus.NOT_FOUND);
    }

    // Single-use code: clear it upon restoration
    await this.prisma.user.update({
      where: { id: user.id },
      data: { recoveryCode: null },
    });

    const token = await this.jwtService.signAsync({ userId: user.id });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        age: user.age,
        stars: user.stars,
        createdAt: user.createdAt,
      },
    };
  }
}
