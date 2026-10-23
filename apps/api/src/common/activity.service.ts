import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}
  write(
    companyId: string,
    userId: string | undefined,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: object,
  ) {
    return this.prisma.activityLog.create({
      data: { companyId, userId, action, entityType, entityId, metadata },
    });
  }
}
