import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, TenantGuard } from '../../common/auth.guard';
import { AuthUser } from '../../common/auth.types';
import { PrismaService } from '../../common/prisma.service';

@Controller('alerts')
@UseGuards(AuthGuard, TenantGuard)
export class AlertsController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() list(@Req() req: Request & { user: AuthUser }) {
    return this.prisma.alert.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
