import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, TenantGuard } from '../../common/auth.guard';
import { AuthUser } from '../../common/auth.types';
import { PrismaService } from '../../common/prisma.service';

@Controller('notifications')
@UseGuards(AuthGuard, TenantGuard)
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() list(@Req() req: Request & { user: AuthUser }) {
    return this.prisma.notification.findMany({
      where: { companyId: req.user.companyId, userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
  @Patch(':id/read') read(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.prisma.notification.updateMany({
      where: { id, companyId: req.user.companyId, userId: req.user.id },
      data: { isRead: true },
    });
  }
}
