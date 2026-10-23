import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../common/prisma.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from '../../common/dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto) {
    const base =
      dto.companyName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'company';
    const slug = `${base}-${randomBytes(3).toString('hex')}`;
    const passwordHash = await argon2.hash(dto.password);
    const result = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: dto.companyName, slug, plan: 'FREE' },
      });
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          name: dto.name,
          email: dto.email.toLowerCase(),
          passwordHash,
          role: 'COMPANY_ADMIN',
        },
      });
      return { company, user };
    });
    return this.issueTokens(result.user, result.company.slug);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim();
    const companySlug = dto.companySlug.trim();
    let user = await this.prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        company: {
          slug: { equals: companySlug, mode: 'insensitive' },
          deletedAt: null,
        },
        deletedAt: null,
        isActive: true,
      },
      include: { company: { select: { slug: true } } },
    });

    if (user) {
      const passwordMatches = await argon2
        .verify(user.passwordHash, dto.password)
        .catch(() => false);
      if (!passwordMatches) throw new UnauthorizedException('Invalid credentials');
    } else {
      // Older registrations generated a random tenant suffix that the login form did not retain.
      const candidates = await this.prisma.user.findMany({
        where: {
          email: { equals: email, mode: 'insensitive' },
          deletedAt: null,
          isActive: true,
          company: { deletedAt: null },
        },
        include: { company: { select: { slug: true } } },
      });
      const matches = [];
      for (const candidate of candidates) {
        if (await argon2.verify(candidate.passwordHash, dto.password).catch(() => false))
          matches.push(candidate);
      }
      if (matches.length !== 1) throw new UnauthorizedException('Invalid credentials');
      user = matches[0];
    }

    return this.issueTokens(user, user.company.slug);
  }

  async refresh(rawToken: string | undefined) {
    if (!rawToken) throw new UnauthorizedException('Refresh token is missing');
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(rawToken) },
      include: { user: { include: { company: { select: { slug: true, deletedAt: true } } } } },
    });
    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt < new Date() ||
      !stored.user.isActive ||
      stored.user.company.deletedAt
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(stored.user, stored.user.company.slug);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        company: { slug: dto.companySlug },
        deletedAt: null,
      },
    });
    if (!user) return { accepted: true };
    const token = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    return {
      accepted: true,
      ...(process.env.NODE_ENV === 'production' ? {} : { resetToken: token }),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashToken(dto.token) },
    });
    if (!stored || stored.usedAt || stored.expiresAt < new Date())
      throw new BadRequestException('Invalid reset token');
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash: await argon2.hash(dto.password) },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { reset: true };
  }

  private async issueTokens(
    user: { id: string; companyId: string; email: string; role: any },
    companySlug: string,
  ) {
    const payload = { sub: user.id, companyId: user.companyId, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET ?? 'development-access-secret',
      expiresIn: '15m',
    });
    const rawRefresh = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(rawRefresh),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return {
      accessToken,
      refreshToken: rawRefresh,
      user: {
        id: user.id,
        companyId: user.companyId,
        email: user.email,
        role: user.role,
        companySlug,
      },
    };
  }
}
