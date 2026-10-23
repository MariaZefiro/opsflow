import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, TenantGuard } from '../../common/auth.guard';
import { AuthUser } from '../../common/auth.types';
import { CommentDto, TicketDto, TicketUpdateDto } from '../../common/dto';
import { TicketsService } from './tickets.service';

@Controller('tickets')
@UseGuards(AuthGuard, TenantGuard)
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}
  @Get() list(
    @Req() req: Request & { user: AuthUser },
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: any,
  ) {
    return this.tickets.list(
      req.user.companyId,
      Number(page),
      Math.min(Number(limit), 100),
      status,
    );
  }
  @Get(':id') get(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.tickets.get(req.user.companyId, id);
  }
  @Post() create(@Req() req: Request & { user: AuthUser }, @Body() dto: TicketDto) {
    return this.tickets.create(req.user.companyId, req.user.id, dto);
  }
  @Patch(':id') update(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: TicketUpdateDto,
  ) {
    return this.tickets.update(req.user.companyId, req.user.id, id, dto);
  }
  @Delete(':id') remove(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.tickets.remove(req.user.companyId, req.user.id, id);
  }
  @Post(':id/comments') comment(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: CommentDto,
  ) {
    return this.tickets.comment(req.user.companyId, req.user.id, id, dto);
  }
}
