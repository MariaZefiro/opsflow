import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TicketPriority, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { ActivityService } from '../../common/activity.service';
import { CommentDto, TicketDto, TicketUpdateDto } from '../../common/dto';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  private async assertAssigneeBelongsToCompany(companyId: string, assigneeId?: string) {
    if (!assigneeId) return;
    const assignee = await this.prisma.user.findFirst({
      where: { id: assigneeId, companyId, deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (!assignee) throw new BadRequestException('Assignee must be an active user in this company');
  }

  list(companyId: string, page = 1, limit = 20, status?: TicketStatus) {
    const where = { companyId, deletedAt: null, ...(status ? { status } : {}) };
    return Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          requester: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]).then(([items, total]) => ({ items, total, page, limit }));
  }
  async get(companyId: string, id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        requester: true,
        assignee: true,
        comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
        history: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }
  async create(companyId: string, userId: string, dto: TicketDto) {
    await this.assertAssigneeBelongsToCompany(companyId, dto.assigneeId);
    const policy = await this.prisma.sLAPolicy.findUnique({
      where: { companyId_priority: { companyId, priority: dto.priority ?? TicketPriority.MEDIUM } },
    });
    const slaDueAt = new Date(Date.now() + (policy?.resolutionHours ?? 24) * 3600000);
    const ticket = await this.prisma.ticket.create({
      data: {
        companyId,
        requesterId: userId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        priority: dto.priority,
        assigneeId: dto.assigneeId,
        slaDueAt,
      },
    });
    await this.activity.write(companyId, userId, 'created', 'Ticket', ticket.id);
    return ticket;
  }
  async update(companyId: string, userId: string, id: string, dto: TicketUpdateDto) {
    const current = await this.prisma.ticket.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Ticket not found');
    await this.assertAssigneeBelongsToCompany(companyId, dto.assigneeId);
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: {
        ...dto,
        resolvedAt:
          dto.status === TicketStatus.RESOLVED ? new Date() : dto.status ? null : undefined,
      },
    });
    for (const field of ['title', 'description', 'priority', 'status', 'assigneeId'] as const)
      if (dto[field] !== undefined && String(current[field]) !== String(dto[field]))
        await this.prisma.ticketHistory.create({
          data: {
            ticketId: id,
            userId,
            field,
            oldValue: String(current[field] ?? ''),
            newValue: String(dto[field] ?? ''),
          },
        });
    await this.activity.write(companyId, userId, 'updated', 'Ticket', id, dto);
    return ticket;
  }
  async remove(companyId: string, userId: string, id: string) {
    const result = await this.prisma.ticket.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (!result.count) throw new NotFoundException('Ticket not found');
    await this.activity.write(companyId, userId, 'deleted', 'Ticket', id);
    return { deleted: true };
  }
  async comment(companyId: string, userId: string, id: string, dto: CommentDto) {
    await this.get(companyId, id);
    return this.prisma.ticketComment.create({
      data: { ticketId: id, authorId: userId, content: dto.content },
      include: { author: true },
    });
  }
}
