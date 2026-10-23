import { Module } from '@nestjs/common';
import { CoreModule } from '../../common/core.module';
import { WebhooksController } from './webhooks.controller';

@Module({ imports: [CoreModule], controllers: [WebhooksController] })
export class WebhooksModule {}
