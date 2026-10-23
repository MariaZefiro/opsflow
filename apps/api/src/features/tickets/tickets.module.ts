import { Module } from '@nestjs/common';
import { CoreModule } from '../../common/core.module';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({ imports: [CoreModule], controllers: [TicketsController], providers: [TicketsService] })
export class TicketsModule {}
