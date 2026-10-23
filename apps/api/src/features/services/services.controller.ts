import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard, TenantGuard } from '../../common/auth.guard';
import { AuthUser } from '../../common/auth.types';
import { ServiceDto, ServiceUpdateDto } from '../../common/dto';
import { ServicesService } from './services.service';

@Controller('services')
@UseGuards(AuthGuard, TenantGuard)
export class ServicesController {
  constructor(private readonly services: ServicesService) {}
  @Get() list(@Req() req: Request & { user: AuthUser }) {
    return this.services.list(req.user.companyId);
  }
  @Get(':id') get(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.services.get(req.user.companyId, id);
  }
  @Post() create(@Req() req: Request & { user: AuthUser }, @Body() dto: ServiceDto) {
    return this.services.create(req.user.companyId, req.user.id, dto);
  }
  @Patch(':id') update(
    @Req() req: Request & { user: AuthUser },
    @Param('id') id: string,
    @Body() dto: ServiceUpdateDto,
  ) {
    return this.services.update(req.user.companyId, req.user.id, id, dto);
  }
  @Delete(':id') remove(@Req() req: Request & { user: AuthUser }, @Param('id') id: string) {
    return this.services.remove(req.user.companyId, req.user.id, id);
  }
}
