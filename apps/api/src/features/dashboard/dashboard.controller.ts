import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, TenantGuard } from '../../common/auth.guard';
import { AuthUser } from '../../common/auth.types';
import { PrismaService } from '../../common/prisma.service';

@Controller('dashboard')
@UseGuards(AuthGuard, TenantGuard)
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}
  @Get('summary') async summary(@Req() req: Request & { user: AuthUser }) {
    const companyId = req.user.companyId;
    const [tickets, incidents, services, unread, checks] = await Promise.all([
      this.prisma.ticket.groupBy({
        by: ['status'],
        where: { companyId, deletedAt: null },
        _count: true,
      }),
      this.prisma.incident.count({ where: { companyId, status: { not: 'RESOLVED' } } }),
      this.prisma.service.count({ where: { companyId, deletedAt: null, isActive: true } }),
      this.prisma.notification.count({ where: { companyId, userId: req.user.id, isRead: false } }),
      this.prisma.serviceCheck.findMany({
        where: { service: { companyId }, checkedAt: { gte: new Date(Date.now() - 24 * 3600000) } },
        select: { success: true },
      }),
    ]);
    return {
      tickets,
      openIncidents: incidents,
      activeServices: services,
      unreadNotifications: unread,
      uptime24h: checks.length ? checks.filter((check) => check.success).length / checks.length : 1,
    };
  }
}
