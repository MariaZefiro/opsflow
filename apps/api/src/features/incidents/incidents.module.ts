import { Module } from '@nestjs/common';
import { CoreModule } from '../../common/core.module';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';

@Module({
  imports: [CoreModule],
  controllers: [IncidentsController],
  providers: [IncidentsService],
})
export class IncidentsModule {}
