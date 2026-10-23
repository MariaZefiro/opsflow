import { Module } from '@nestjs/common';
import { CoreModule } from '../../common/core.module';
import { DashboardController } from './dashboard.controller';

@Module({ imports: [CoreModule], controllers: [DashboardController] })
export class DashboardModule {}
