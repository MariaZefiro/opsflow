import { Module } from '@nestjs/common';
import { CoreModule } from '../../common/core.module';
import { MonitorService } from './monitor.service';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [CoreModule],
  controllers: [ServicesController],
  providers: [ServicesService, MonitorService],
})
export class ServicesModule {}
