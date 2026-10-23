import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ActivityService } from './activity.service';
import { AuthGuard, TenantGuard } from './auth.guard';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [PrismaService, ActivityService, AuthGuard, TenantGuard],
  exports: [PrismaService, ActivityService, AuthGuard, TenantGuard, JwtModule],
})
export class CoreModule {}
