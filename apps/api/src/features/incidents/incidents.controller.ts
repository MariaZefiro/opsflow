import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, TenantGuard } from '../../common/auth.guard';
import { AuthUser } from '../../common/auth.types';
import { IncidentDto, IncidentUpdateDto } from '../../common/dto';
import { IncidentsService } from './incidents.service';

@Controller('incidents')
@UseGuards(AuthGuard, TenantGuard)
export class IncidentsController {
  constructor(private readonly incidents: IncidentsService) {}
  @Get() list(@Req() req: Request & { user: AuthUser }) {
    return this.incidents.list(req.user.companyId);
  }
  @Post() create(@Req() req: Request & { user: AuthUser }, @Body() dto: IncidentDto) {
    return this.incidents.create(req.user.companyId, req.user.id, dto);
  }
  @Patch(':id') update(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: IncidentUpdateDto,
  ) {
    return this.incidents.update(req.user.companyId, req.user.id, id, dto);
  }
}
