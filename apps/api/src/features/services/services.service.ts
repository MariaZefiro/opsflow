import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ActivityService } from '../../common/activity.service';
import { ServiceDto, ServiceUpdateDto } from '../../common/dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}
  list(companyId: string) {
    return this.prisma.service.findMany({
      where: { companyId, deletedAt: null },
      include: {
        checks: { orderBy: { checkedAt: 'desc' }, take: 1 },
        _count: { select: { checks: true, incidents: true } },
      },
      orderBy: { name: 'asc' },
    });
  }
  async get(companyId: string, id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        checks: { orderBy: { checkedAt: 'desc' }, take: 100 },
        incidents: { orderBy: { startedAt: 'desc' }, take: 20 },
      },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }
  async create(companyId: string, userId: string, dto: ServiceDto) {
    const service = await this.prisma.service.create({ data: { companyId, ...dto } });
    await this.activity.write(companyId, userId, 'created', 'Service', service.id);
    return service;
  }
  async update(companyId: string, userId: string, id: string, dto: ServiceUpdateDto) {
    const result = await this.prisma.service.updateMany({
      where: { id, companyId, deletedAt: null },
      data: dto,
    });
    if (!result.count) throw new NotFoundException('Service not found');
    const service = await this.prisma.service.findUniqueOrThrow({ where: { id } });
    await this.activity.write(companyId, userId, 'updated', 'Service', id);
    return service;
  }
  async remove(companyId: string, userId: string, id: string) {
    const result = await this.prisma.service.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (!result.count) throw new NotFoundException('Service not found');
    await this.activity.write(companyId, userId, 'deleted', 'Service', id);
    return { deleted: true };
  }
}
