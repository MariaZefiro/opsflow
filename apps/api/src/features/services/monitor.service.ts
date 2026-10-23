import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { IncidentCreatedBy, IncidentSeverity, IncidentStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class MonitorService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  constructor(private readonly prisma: PrismaService) {}
  onModuleInit() {
    this.timer = setInterval(() => void this.checkAll(), 60000);
    void this.checkAll();
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  private async checkAll() {
    const services = await this.prisma.service.findMany({
      where: { isActive: true, deletedAt: null },
    });
    for (const service of services) await this.check(service);
  }
  async check(service: {
    id: string;
    companyId: string;
    url: string;
    expectedStatus: number;
    timeout: number;
  }) {
    const started = Date.now();
    let httpStatus: number | undefined;
    let success = false;
    let errorMessage: string | undefined;
    try {
      const response = await fetch(service.url, {
        signal: AbortSignal.timeout(service.timeout * 1000),
      });
      httpStatus = response.status;
      success = response.status === service.expectedStatus;
      if (!success)
        errorMessage = `Expected ${service.expectedStatus}, received ${response.status}`;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Request failed';
    }
    await this.prisma.serviceCheck.create({
      data: {
        serviceId: service.id,
        httpStatus,
        responseTimeMs: Date.now() - started,
        success,
        errorMessage,
      },
    });
    if (!success) await this.openIncident(service, errorMessage ?? 'Service check failed');
  }
  private async openIncident(service: { id: string; companyId: string }, message: string) {
    const existing = await this.prisma.incident.findFirst({
      where: {
        companyId: service.companyId,
        serviceId: service.id,
        status: { not: IncidentStatus.RESOLVED },
      },
    });
    if (existing) return;
    const actor = await this.prisma.user.findFirst({
      where: {
        companyId: service.companyId,
        role: { in: ['COMPANY_ADMIN', 'SUPER_ADMIN'] },
        isActive: true,
      },
    });
    if (!actor) return;
    await this.prisma.incident.create({
      data: {
        companyId: service.companyId,
        serviceId: service.id,
        createdByUserId: actor.id,
        createdBy: IncidentCreatedBy.MONITORING,
        title: 'Service unavailable',
        description: message,
        severity: IncidentSeverity.HIGH,
      },
    });
    await this.prisma.alert.create({
      data: {
        companyId: service.companyId,
        type: 'incident.created',
        payload: { serviceId: service.id, message },
        channel: 'IN_APP',
      },
    });
  }
}
