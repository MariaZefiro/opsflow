import { Module } from '@nestjs/common';
import { CoreModule } from '../../common/core.module';
import { AlertsController } from './alerts.controller';

@Module({ imports: [CoreModule], controllers: [AlertsController] })
export class AlertsModule {}
