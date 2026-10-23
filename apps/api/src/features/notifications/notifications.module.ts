import { Module } from '@nestjs/common';
import { CoreModule } from '../../common/core.module';
import { NotificationsController } from './notifications.controller';

@Module({ imports: [CoreModule], controllers: [NotificationsController] })
export class NotificationsModule {}
