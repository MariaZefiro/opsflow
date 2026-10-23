import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IncidentCreatedBy, IncidentStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { ActivityService } from '../../common/activity.service';
import { IncidentDto, IncidentUpdateDto } from '../../common/dto';

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  private async assertRelationsBelongToCompany(
    companyId: string,
    serviceId?: string,
    assigneeId?: string,
  ) {
    if (serviceId) {
      const service = await this.prisma.service.findFirst({
        where: { id: serviceId, companyId, deletedAt: null },
        select: { id: true },
      });
      if (!service) throw new BadRequestException('Service must belong to this company');
    }
    if (assigneeId) {
      const assignee = await this.prisma.user.findFirst({
        where: { id: assigneeId, companyId, deletedAt: null, isActive: true },
        select: { id: true },
      });
      if (!assignee)
        throw new BadRequestException('Assignee must be an active user in this company');
    }
  }

  list(companyId: string) {
    return this.prisma.incident.findMany({
      where: { companyId },
      include: {
        service: { include: { checks: { orderBy: { checkedAt: 'desc' }, take: 1 } } },
        assignee: true,
        creator: true,
      },
      orderBy: { startedAt: 'desc' },
    });
  }
  async create(
    companyId: string,
    userId: string,
    dto: IncidentDto,
    createdBy = IncidentCreatedBy.MANUAL,
  ) {
    await this.assertRelationsBelongToCompany(companyId, dto.serviceId, dto.assigneeId);
    const incident = await this.prisma.incident.create({
      data: {
        companyId,
        createdByUserId: userId,
        createdBy,
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        serviceId: dto.serviceId,
        assigneeId: dto.assigneeId,
      },
    });
    await this.activity.write(companyId, userId, 'created', 'Incident', incident.id);
    return incident;
  }
  async update(companyId: string, userId: string, id: string, dto: IncidentUpdateDto) {
    const current = await this.prisma.incident.findFirst({ where: { id, companyId } });
    if (!current) throw new NotFoundException('Incident not found');
    await this.assertRelationsBelongToCompany(companyId, undefined, dto.assigneeId);
    const resolved = dto.status === IncidentStatus.RESOLVED;
    const endedAt = resolved ? new Date() : undefined;
    const durationSeconds = resolved
      ? Math.floor((Number(endedAt) - Number(current.startedAt)) / 1000)
      : undefined;
    const incident = await this.prisma.incident.update({
      where: { id },
      data: { ...dto, endedAt, durationSeconds },
    });
    await this.activity.write(companyId, userId, 'updated', 'Incident', id, dto);
    return incident;
  }
}
