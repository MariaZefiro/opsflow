import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { AuthGuard, TenantGuard } from '../../common/auth.guard';
import { AuthUser } from '../../common/auth.types';
import { WebhookDto } from '../../common/dto';
import { PrismaService } from '../../common/prisma.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  @UseGuards(AuthGuard, TenantGuard)
  list(@Req() req: Request & { user: AuthUser }) {
    return this.prisma.webhook.findMany({
      where: { companyId: req.user.companyId },
      select: { id: true, url: true, events: true, isActive: true, createdAt: true },
    });
  }
  @Post()
  @UseGuards(AuthGuard, TenantGuard)
  async create(@Req() req: Request & { user: AuthUser }, @Body() body: WebhookDto) {
    return this.prisma.webhook.create({
      data: {
        companyId: req.user.companyId,
        url: body.url,
        events: body.events,
        secret: randomBytes(32).toString('hex'),
      },
      select: { id: true, url: true, events: true, secret: true },
    });
  }
  @Post('receive/:id')
  async receive(
    @Param('id') id: string,
    @Headers('x-opsflow-signature') signature: string | undefined,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    const webhook = await this.prisma.webhook.findUnique({ where: { id } });
    if (!webhook || !signature || !req.rawBody) throw new BadRequestException();
    const expected = createHmac('sha256', webhook.secret).update(req.rawBody).digest('hex');
    const valid =
      signature.length === expected.length &&
      timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid) throw new BadRequestException('Invalid signature');
    return { accepted: true };
  }
}
